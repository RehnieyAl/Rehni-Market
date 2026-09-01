import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { setPostLoginRedirect } from "@/api/session";

export function useRedirectToLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    setPostLoginRedirect(location.pathname + location.search);
    navigate("/login");
  }, [navigate, location]);
}
