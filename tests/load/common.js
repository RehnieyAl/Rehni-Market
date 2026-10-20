// Utilidades compartidas por los escenarios de tests/load/.
//
// BASE_URL se toma de la variable de entorno K6_BASE_URL (o BASE_URL como
// alias), nunca hardcodeada: el script anterior (scripts/load_test.k6.js)
// tenía una IP privada fija, lo que lo hacía no portable entre entornos.
//
// Todos los escenarios de esta carpeta son de SOLO LECTURA contra endpoints
// públicos del catálogo (/public/...). No ejecutan checkout, registro ni
// ninguna escritura: el objetivo de esta auditoría es medir estabilidad de
// infraestructura (pool de conexiones, PgBouncer, event loop) sin mutar
// datos reales ni de prueba. Ver tests/load/README.md, sección "Alcance".

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export const BASE_URL =
  __ENV.K6_BASE_URL || __ENV.BASE_URL || 'http://127.0.0.1:8000';

// Tasa de errores de negocio (respuesta 200 pero contenido inesperado, o
// cualquier check fallido que no sea ya un status code erróneo contado por
// k6 como http_req_failed).
export const businessErrors = new Rate('errores_negocio');

// Tiempo de respuesta separado por grupo lógico, para poder comparar
// catálogo/búsqueda/detalle igual que hacía el script anterior.
export const trendByGroup = {
  catalogo: new Trend('duracion_catalogo', true),
  busqueda: new Trend('duracion_busqueda', true),
  detalle: new Trend('duracion_detalle', true),
  secciones: new Trend('duracion_secciones', true),
};

// Umbrales base compartidos. Cada escenario puede añadir los suyos encima.
// IMPORTANTE: estos son objetivos de aceptación propuestos para esta
// auditoría, NO límites ya acordados con el equipo del proyecto ni SLAs
// contractuales — deben confirmarse o ajustarse con el equipo antes de usarse
// como criterio de aprobación/rechazo en CI.
export const BASE_THRESHOLDS = {
  http_req_failed: ['rate<0.01'],
  errores_negocio: ['rate<0.01'],
};

export function fetchCatalogoYProducto() {
  let productId = null;

  const r = http.get(`${BASE_URL}/public/products?limit=12`, {
    tags: { group: 'catalogo' },
  });
  trendByGroup.catalogo.add(r.timings.duration);
  const ok = check(r, { 'catalogo 200': (x) => x.status === 200 });
  if (!ok) businessErrors.add(1);
  else businessErrors.add(0);

  try {
    const body = r.json();
    if (body && body.products && body.products.length) {
      productId = body.products[0].id;
    }
  } catch (_) {
    businessErrors.add(1);
  }

  return productId;
}

export function fetchBusqueda() {
  const r = http.get(`${BASE_URL}/public/products?search=a&limit=12`, {
    tags: { group: 'busqueda' },
  });
  trendByGroup.busqueda.add(r.timings.duration);
  const ok = check(r, { 'busqueda 200': (x) => x.status === 200 });
  businessErrors.add(ok ? 0 : 1);
}

export function fetchDetalle(productId) {
  if (!productId) return;
  const r = http.get(`${BASE_URL}/public/products/${productId}`, {
    tags: { group: 'detalle' },
  });
  trendByGroup.detalle.add(r.timings.duration);
  const ok = check(r, { 'detalle 200': (x) => x.status === 200 });
  businessErrors.add(ok ? 0 : 1);
}

export function fetchSecciones() {
  const ofertas = http.get(`${BASE_URL}/public/products/offers?limit=12`, {
    tags: { group: 'secciones' },
  });
  const novedades = http.get(`${BASE_URL}/public/products/new?limit=12`, {
    tags: { group: 'secciones' },
  });
  trendByGroup.secciones.add(ofertas.timings.duration);
  trendByGroup.secciones.add(novedades.timings.duration);

  const ok =
    check(ofertas, { 'ofertas 200': (x) => x.status === 200 }) &&
    check(novedades, { 'novedades 200': (x) => x.status === 200 });
  businessErrors.add(ok ? 0 : 1);
}

export function fetchCatalogosYColores() {
  const catalogos = http.get(`${BASE_URL}/public/catalogs`, {
    tags: { group: 'catalogo' },
  });
  const colores = http.get(`${BASE_URL}/public/colors`, {
    tags: { group: 'catalogo' },
  });
  const ok =
    check(catalogos, { 'catalogos 200': (x) => x.status === 200 }) &&
    check(colores, { 'colores 200': (x) => x.status === 200 });
  businessErrors.add(ok ? 0 : 1);
}

// Recorrido completo de lectura pública: catálogo -> búsqueda -> detalle ->
// secciones -> catálogos/colores. Usado por todos los escenarios.
export function recorridoLectura() {
  const productId = fetchCatalogoYProducto();
  fetchBusqueda();
  fetchDetalle(productId);
  fetchSecciones();
  fetchCatalogosYColores();
}
