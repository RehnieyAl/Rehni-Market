import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// React Router no resetea el scroll al cambiar de ruta. Se monta una vez a nivel de router.
// Solo actúa en PUSH/REPLACE; en POP (Atrás/Adelante) respeta la posición previa.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
}
