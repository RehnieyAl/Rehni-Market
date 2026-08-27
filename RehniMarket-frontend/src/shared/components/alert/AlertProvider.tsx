
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import AlertMessage from "./AlertMessage";
import {
  AlertContext,
  type AlertType,
} from "./AlertContext";

import {
  registerAlertListener,
} from "./alertManager";

interface AlertProviderProps {
  children: ReactNode;
}

interface AlertState {
  id: number;
  type: AlertType;
  message: string;
}

export default function AlertProvider({
  children,
}: AlertProviderProps) {
  // Estado inicial calculado en un inicializador perezoso (corre una sola
  // vez, antes del primer render) en vez de en un efecto: redirectToLogin/
  // redirectToLoginWithMessage (ver api/session.ts) hacen un
  // window.location.href, es decir, una recarga completa de página - por
  // eso no pueden llamar a showAlert directamente (el remount de
  // AlertProvider que sigue lo borraría). Dejan el mensaje en
  // sessionStorage y este inicializador lo consume (lee y borra) para que
  // ya esté en el estado desde el primer render, sin depender de un
  // setState dentro de un efecto. Cubre tanto "sesión expirada" como
  // "cuenta bloqueada" (ver AUDITORÍA de bloqueo de cuentas).
  const [alert, setAlert] =
    useState<AlertState | null>(() => {
      const pendingMessage =
        sessionStorage.getItem("auth_alert");

      if (!pendingMessage) {
        return null;
      }

      sessionStorage.removeItem("auth_alert");

      return {
        id: 1,
        type: "error",
        message: pendingMessage,
      };
    });

  /*
   * ==========================
   * MOSTRAR ALERTA
   * ==========================
   */

  const showAlert = (
    type: AlertType,
    message: string,
  ) => {
    setAlert((currentAlert) => ({
      id: (currentAlert?.id ?? 0) + 1,
      type,
      message,
    }));
  };

  /*
   * ==========================
   * REGISTRAR LISTENER GLOBAL
   * ==========================
   */

  useEffect(() => {
    const unregister =
      registerAlertListener(
        showAlert,
      );

    return unregister;
  }, []);

  /*
   * ==========================
   * CERRAR ALERTA
   * ==========================
   */

  const closeAlert = () => {
    setAlert(null);
  };

  /*
   * ==========================
   * AUTO CIERRE
   * ==========================
   */

  useEffect(() => {
    if (!alert) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setAlert(null);
      }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [alert]);

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        closeAlert,
      }}
    >
      {children}

      {alert && (
        <AlertMessage
          key={alert.id}
          type={alert.type}
          message={alert.message}
          onClose={closeAlert}
        />
      )}
    </AlertContext.Provider>
  );
}

