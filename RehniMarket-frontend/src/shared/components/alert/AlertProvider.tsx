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

  useEffect(() => {
    const unregister =
      registerAlertListener(
        showAlert,
      );

    return unregister;
  }, []);

  const closeAlert = () => {
    setAlert(null);
  };

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
