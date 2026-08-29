import { createContext } from "react";

export type AlertType = "error" | "success" | "warning" | "info";

export interface AlertContextType {
  showAlert: (type: AlertType, message: string) => void;
  closeAlert: () => void;
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined);
