// Prueba de estrés: empuja la concurrencia más allá de lo observado como
// seguro en tests/load/03-ramping.js, para encontrar el límite real del
// entorno. El tope (STRESS_MAX_VUS) es deliberadamente acotado para no
// arriesgar el host compartido donde corre esta prueba; súbelo solo si el
// entorno y los resultados de las pruebas anteriores lo justifican.
//
// Esta prueba puede generar errores 5xx, timeouts y reinicios de contenedor
// a propósito: ese es su objetivo. No la ejecutes contra un entorno
// compartido con otros usuarios sin avisar antes.
//
// Uso:
//   k6 run -e K6_BASE_URL=http://127.0.0.1:8000 \
//          -e STRESS_MAX_VUS=400 tests/load/05-stress.js

import { sleep } from 'k6';
import { recorridoLectura } from './common.js';

const STRESS_MAX_VUS = Number(__ENV.STRESS_MAX_VUS || 400);

export const options = {
  scenarios: {
    estres: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Math.round(STRESS_MAX_VUS * 0.25) },
        { duration: '30s', target: Math.round(STRESS_MAX_VUS * 0.5) },
        { duration: '30s', target: Math.round(STRESS_MAX_VUS * 0.75) },
        { duration: '30s', target: STRESS_MAX_VUS },
        { duration: '1m', target: STRESS_MAX_VUS },
        { duration: '30s', target: 0 },
      ],
    },
  },
  // Sin thresholds que aborten la corrida: en estrés se espera degradación;
  // el análisis es posterior, con los datos crudos (ver README, "Métricas").
};

export default function () {
  recorridoLectura();
  sleep(Math.random() * 0.8 + 0.2);
}
