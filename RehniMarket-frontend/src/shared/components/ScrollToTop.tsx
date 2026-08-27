import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// React Router (SPA) no resetea el scroll al cambiar de ruta como sí lo
// hace una navegación de página completa - sin esto, entrar a
// /products/:id (desde Home/Productos/Categorías/relacionados) conserva
// el scroll de la pantalla anterior. Se monta una única vez a nivel de
// router (ver AppRouter.tsx), no en cada página, para no terminar con
// varios mecanismos de scroll distintos.
//
// Solo actúa en navegación PUSH/REPLACE (ir hacia adelante a una ruta
// nueva). En POP (botón Atrás/Adelante del navegador) no fuerza nada, para
// no pisar la posición de scroll que el usuario espera recuperar al
// volver.
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
