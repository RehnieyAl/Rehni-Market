import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Uso:
//   k6 run -e BASE_URL=http://10.90.41.168:8000 -e VUS=1000 scripts/load_test.k6.js
const BASE = __ENV.BASE_URL || 'http://10.90.41.168:8000';
const VUS = parseInt(__ENV.VUS || '1000', 10);
const RUN_CHECKOUT = (__ENV.CHECKOUT || '1') === '1';

const errors = new Rate('errores_negocio');

// Timeout por petición menor que el de k6 (60s) y que QUERY_WAIT_TIMEOUT de
// PgBouncer (30s): una petición encolada se cuenta como fallo en vez de
// mantener abierta la conexión del VU.
const PARAMS = { timeout: '20s' };
// Respuestas que no se leen: k6 no guarda el body (menos memoria con 1000 VUs).
const NO_BODY = { ...PARAMS, responseType: 'none' };

export const options = {
  scenarios: {
    lectura: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: VUS },
        { duration: '2m', target: VUS },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
      gracefulStop: '30s',
      exec: 'lectura',
    },
  },
  thresholds: {
    // Si el backend empieza a fallar de forma sostenida, se aborta la prueba
    // en lugar de seguir martillando Postgres/PgBouncer hasta tumbarlos.
    http_req_failed: [
      'rate<0.01',
      { threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '1m' },
    ],
    'http_req_duration{group:::catalogo}': ['p(95)<800'],
    'http_req_duration{group:::busqueda}': ['p(95)<600'],
    'http_req_duration{group:::detalle}': ['p(95)<500'],
    errores_negocio: ['rate<0.01'],
  },
};

// Registra éxito Y fallo: con solo `errors.add(1)` la tasa nunca baja de 100%.
function ok(res, name) {
  const passed = check(res, { [name]: (x) => x.status === 200 });
  errors.add(!passed);
  return passed;
}

export function lectura() {
  let productId = null;

  group('catalogo', () => {
    const r = http.get(`${BASE}/public/products?limit=12`, PARAMS);
    if (!ok(r, 'catalogo 200')) return;
    try {
      const products = r.json('products') || [];
      // Producto aleatorio: no concentrar toda la carga sobre la misma fila.
      if (products.length) productId = products[Math.floor(Math.random() * products.length)].id;
    } catch (_) { errors.add(1); }
  });

  group('busqueda', () => {
    ok(http.get(`${BASE}/public/products?search=audio&limit=12`, NO_BODY), 'busqueda 200');
  });

  if (productId) {
    group('detalle', () => {
      // Tag `name` fijo: sin él cada UUID crea una serie de métricas distinta.
      ok(
        http.get(`${BASE}/public/products/${productId}`, { ...NO_BODY, tags: { name: 'detalle' } }),
        'detalle 200',
      );
    });
  }

  group('secciones', () => {
    ok(http.get(`${BASE}/public/products/offers?limit=12`, NO_BODY), 'ofertas 200');
    ok(http.get(`${BASE}/public/products/new?limit=12`, NO_BODY), 'novedades 200');
  });

  sleep(Math.random() * 2 + 0.5);
}

export function compra() {
}
