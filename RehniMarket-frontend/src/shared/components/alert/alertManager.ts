export type AlertType = "error" | "success";

export type AlertListener = (
  type: AlertType,
  message: string,
) => void;

let listener: AlertListener | null = null;

export function registerAlertListener(
  callback: AlertListener,
) {
  listener = callback;

  return () => {
    listener = null;
  };
}

export function showGlobalAlert(
  type: AlertType,
  message: string,
) {
  if (!listener) {
    console.warn(
      "NO EXISTE ALERT LISTENER",
    );

    return;
  }

  listener(type, message);
}