/** Contexto del modal de inicio de sesión: abre el login sobre la página actual sin navegar. */
import { createContext, useContext } from "react";

export interface LoginModalContextValue {
  openLogin: () => void;
}

export const LoginModalContext = createContext<LoginModalContextValue | null>(null);

/** null fuera del proveedor (pruebas de componentes sueltos): quien lo usa cae a la página /login. */
export function useLoginModal(): LoginModalContextValue | null {
  return useContext(LoginModalContext);
}
