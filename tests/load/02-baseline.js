// Carga base: concurrencia pequeña y constante, para establecer latencia,
// tasa de error y consumo "normal" contra el cual comparar las pruebas
// siguientes (gradual, sostenida, estrés).
//
// Uso:
//   k6 run -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/02-baseline.js

import { sleep } from 'k6';
import { recorridoLectura, BASE_THRESHOLDS } from './common.js';

export const options = {
  scenarios: {
    carga_base: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    // Nota: se usan las métricas Trend propias (duracion_*), no la sintaxis
    // 'http_req_duration{group:::x}' de k6: esa solo filtra por tags creados
    // con la función group(), que este suite no usa (usa tags:{group:...}
    // en common.js, un tag distinto). Con el nombre nativo "group:::" el
    // filtro queda vacío y el umbral pasa sin evaluar nada.
    duracion_catalogo: ['p(95)<800'],
    duracion_busqueda: ['p(95)<600'],
    duracion_detalle: ['p(95)<500'],
  },
};

export default function () {
  recorridoLectura();
  sleep(Math.random() * 2 + 0.5);
}
