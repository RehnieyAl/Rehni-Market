// Carga gradual: incrementa la concurrencia por etapas (20 -> 50 -> 100 ->
// 200 VUs) para observar en qué punto empiezan a degradarse la latencia o
// la tasa de error. No asumas de antemano cuál es ese punto: es justamente
// lo que esta prueba busca medir.
//
// Mientras corre, observa en paralelo (ver tests/load/README.md):
//   - docker stats (CPU/memoria de backend, pgbouncer, postgres)
//   - logs del backend y de pgbouncer (errores de pool, timeouts)
//   - conexiones activas en Postgres
//
// Uso:
//   k6 run -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/03-ramping.js

import { sleep } from 'k6';
import { recorridoLectura, BASE_THRESHOLDS } from './common.js';

export const options = {
  scenarios: {
    carga_gradual: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    // Umbrales deliberadamente laxos: el objetivo de esta prueba es
    // OBSERVAR dónde se degrada el sistema, no hacerla fallar al primer
    // signo de estrés. abortOnFail queda desactivado a propósito.
    ...BASE_THRESHOLDS,
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  recorridoLectura();
  sleep(Math.random() * 1.5 + 0.3);
}
