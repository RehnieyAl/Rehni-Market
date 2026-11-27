/** Proveedor de alertas globales: una alerta a la vez, cierre automático a los 5 s y puente con alertManager. */
import {
  useCallback,
  useEffect,
  useMemo,
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
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Referencias estables: los consumidores las usan en dependencias de efectos y el contexto no
  // debe re-renderizar a toda la app cada vez que cambia la alerta visible.
  const showAlert = useCallback((type: AlertType, message: string) => {
    setAlert((currentAlert) => ({
      id: (currentAlert?.id ?? 0) + 1,
      type,
      message,
    }));
  }, []);

  useEffect(() => registerAlertListener(showAlert), [showAlert]);

  const closeAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const contextValue = useMemo(() => ({ showAlert, closeAlert }), [showAlert, closeAlert]);

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
    <AlertContext.Provider value={contextValue}>
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
