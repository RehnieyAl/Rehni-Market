import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:8000';
const RUN_CHECKOUT = (__ENV.CHECKOUT || '1') === '1';

const errors = new Rate('errores_negocio');

export const options = {
  scenarios: {
    lectura: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 30 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      exec: 'lectura',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{group:::catalogo}': ['p(95)<800'],
    'http_req_duration{group:::busqueda}': ['p(95)<600'],
    'http_req_duration{group:::detalle}': ['p(95)<500'],
    errores_negocio: ['rate<0.01'],
  },
};

export function lectura() {
  let productId = null;

  group('catalogo', () => {
    const r = http.get(`${BASE}/public/products?limit=12`);
    check(r, { 'catalogo 200': (x) => x.status === 200 }) || errors.add(1);
    try {
      const body = r.json();
      if (body.products && body.products.length) productId = body.products[0].id;
    } catch (_) { errors.add(1); }
  });

  group('busqueda', () => {
    const r = http.get(`${BASE}/public/products?search=audio&limit=12`);
    check(r, { 'busqueda 200': (x) => x.status === 200 }) || errors.add(1);
  });

  if (productId) {
    group('detalle', () => {
      const r = http.get(`${BASE}/public/products/${productId}`);
      check(r, { 'detalle 200': (x) => x.status === 200 }) || errors.add(1);
    });
  }

  group('secciones', () => {
    check(http.get(`${BASE}/public/products/offers?limit=12`), { 'ofertas 200': (x) => x.status === 200 }) || errors.add(1);
    check(http.get(`${BASE}/public/products/new?limit=12`), { 'novedades 200': (x) => x.status === 200 }) || errors.add(1);
  });

  sleep(Math.random() * 2 + 0.5);
}

export function compra() {
}
