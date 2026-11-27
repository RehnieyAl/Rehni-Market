/** Pide iniciar sesión sin perder la página: abre el modal de login sobre ella. Fuera del proveedor del
 * modal (vistas sueltas) cae a la página /login recordando la ruta para volver. */
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { setPostLoginRedirect } from "@/api/session";

import { useLoginModal } from "../context/LoginModalContext";

export function useRedirectToLogin() {
  const loginModal = useLoginModal();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (loginModal) {
      loginModal.openLogin();
      return;
    }
    setPostLoginRedirect(location.pathname + location.search);
    void navigate("/login");
  }, [loginModal, navigate, location]);
}
