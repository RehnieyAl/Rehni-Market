// Recuperación: aplica un pico breve de carga y luego la reduce a casi nada,
// para comprobar que el backend vuelve a comportarse con normalidad una vez
// que la presión desaparece (y no queda con conexiones agotadas, errores
// persistentes o contenedores caídos).
//
// El escenario "post_recuperacion" arranca justo cuando termina el pico y
// tiene su propio umbral de latencia/errores: si esos umbrales fallan,
// el backend no se recuperó solo con quitar la carga.
//
// Uso:
//   k6 run -e K6_BASE_URL=http://127.0.0.1:8000 tests/load/06-recovery.js
//
// Después de esta prueba, revisa también (fuera de k6, ver README):
//   docker compose ps   (contenedores reiniciados / unhealthy)
//   curl .../health/database

import { sleep } from 'k6';
import { recorridoLectura, BASE_THRESHOLDS } from './common.js';

const PEAK_VUS = Number(__ENV.PEAK_VUS || 150);
const PEAK_DURATION = '20s';
const PEAK_RAMP = '20s';

export const options = {
  scenarios: {
    pico: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: PEAK_RAMP, target: PEAK_VUS },
        { duration: PEAK_DURATION, target: PEAK_VUS },
        { duration: PEAK_RAMP, target: 0 },
      ],
    },
    post_recuperacion: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      startTime: '1m', // arranca justo después de que "pico" termina (20+20+20s)
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    // Solo se exige recuperación en el tramo posterior al pico: durante el
    // pico mismo se acepta degradación (es la prueba de estrés la que mide
    // eso). Si este umbral falla, el sistema no recuperó su latencia normal
    // apenas se quitó la carga.
    'http_req_duration{scenario:post_recuperacion}': ['p(95)<800'],
    'http_req_failed{scenario:post_recuperacion}': ['rate<0.01'],
  },
};

export default function () {
  recorridoLectura();
  sleep(Math.random() * 1 + 0.3);
}
