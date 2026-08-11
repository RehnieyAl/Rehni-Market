
import axios from "axios";

import { showGlobalAlert } from "@/shared/components/alert/alertManager";

export function handleApiError(
  error: unknown,
) {
  if (!axios.isAxiosError(error)) {
    showGlobalAlert(
      "error",
      "Ocurrió un error inesperado.",
    );

    return;
  }

  const detail = error.response?.data?.detail;

  const code = detail?.code;
  const message = detail?.message;

  console.log("API ERROR CODE:", code);
  console.log("API ERROR MESSAGE:", message);

  if (message) {
    showGlobalAlert("error", message);
    return;
  }

  showGlobalAlert(
    "error",
    "Ocurrió un error al procesar la solicitud.",
  );
}

