/** Flecha "Regresar" de los formularios: vuelve al paso anterior del historial de la app y, si la
 * página se abrió directamente (sin historial propio), a `fallback`. */
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface AuthBackButtonProps {
  fallback: string;
}

export default function AuthBackButton({ fallback }: AuthBackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // "default" es la clave de la primera entrada: no hay un paso anterior dentro de la app.
  const hasHistory = location.key !== "default";

  return (
    <button
      type="button"
      onClick={() => void (hasHistory ? navigate(-1) : navigate(fallback, { replace: true }))}
      aria-label="Regresar"
      className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-3 text-ink transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 sm:left-5 sm:top-5 sm:h-12 sm:w-12"
    >
      <ArrowLeft size={20} aria-hidden="true" />
    </button>
  );
}
