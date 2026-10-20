// Prueba de humo: muy poca carga, solo confirma que los endpoints públicos
// responden correctamente antes de pasar a cualquier prueba con más VUs.
//
// Uso:
//   k6 run -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/01-smoke.js

import { sleep } from 'k6';
import { recorridoLectura, BASE_THRESHOLDS } from './common.js';

export const options = {
  scenarios: {
    humo: {
      executor: 'constant-vus',
      vus: 2,
      duration: '30s',
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  recorridoLectura();
  sleep(1);
}
