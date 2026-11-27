/** Sin interfaz: recuerda la última página pública visitada y avisa cuando la sesión expira. En una
 * página pública el usuario sigue en ella como visitante; en una privada RequireAuth lo lleva al login. */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { SESSION_EXPIRED_EVENT, type SessionExpiredDetail } from "@/api/session";
import { useAlert } from "@/shared/components/alert/useAlert";

import { rememberPublicPath } from "../authNavigation";

export default function SessionNavigator() {
  const location = useLocation();
  const { showAlert } = useAlert();

  useEffect(() => {
    rememberPublicPath(location.pathname + location.search + location.hash);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const handleExpired = (event: Event) => {
      showAlert("error", (event as CustomEvent<SessionExpiredDetail>).detail.message);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [showAlert]);

  return null;
}
