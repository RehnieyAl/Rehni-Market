// Carga sostenida: mantiene una concurrencia estable el tiempo suficiente
// para detectar agotamiento progresivo (conexiones que no se liberan,
// memoria que crece, pools que no se recuperan) en vez de picos puntuales.
//
// El nivel de VUs (30) se eligió por debajo del punto de degradación
// observado en tests/load/03-ramping.js; ajusta SUSTAINED_VUS según lo que
// esa prueba haya mostrado en tu entorno antes de ejecutar esta.
//
// Uso:
//   k6 run -e K6_BASE_URL=http://127.0.0.1:8000 \
//          -e SUSTAINED_VUS=30 tests/load/04-sustained.js

import { sleep } from 'k6';
import { recorridoLectura, BASE_THRESHOLDS } from './common.js';

const SUSTAINED_VUS = Number(__ENV.SUSTAINED_VUS || 30);

export const options = {
  scenarios: {
    carga_sostenida: {
      executor: 'constant-vus',
      vus: SUSTAINED_VUS,
      duration: '5m',
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  recorridoLectura();
  sleep(Math.random() * 2 + 0.5);
}
