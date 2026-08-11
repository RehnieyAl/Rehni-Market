
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
  const [alert, setAlert] =
    useState<AlertState | null>(null);

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

