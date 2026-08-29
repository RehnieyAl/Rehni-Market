import type { AlertType } from "./AlertContext";

export type { AlertType };

export type AlertListener = (type: AlertType, message: string) => void;

let listener: AlertListener | null = null;

export function registerAlertListener(callback: AlertListener) {
  listener = callback;

  return () => {
    listener = null;
  };
}

export function showGlobalAlert(type: AlertType, message: string) {
  if (!listener) {
    console.warn("No hay un AlertProvider montado.");
    return;
  }

  listener(type, message);
}
