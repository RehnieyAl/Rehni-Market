import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface ComingSoonProps {
  icon: ReactNode;
  // Todos opcionales y retrocompatibles: por defecto se comporta
  // exactamente igual que antes ("Próximamente", sin descripción ni
  // acción).
  description?: string;
  title?: string;
  action?: {
    label: string;
    to: string;
  };
}

// Estado honesto para secciones sin backend todavía (ver ALCANCE >
// Pedidos/Favoritos/Direcciones): mismo bloque visual reutilizado en los
// dashboards de empresa/usuario en vez de duplicarlo en cada archivo.
export default function ComingSoon({
  icon,
  description,
  title = "Próximamente",
  action,
}: ComingSoonProps) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-12 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          {icon}
        </div>

        <h2 className="text-2xl font-semibold text-gray-900">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-lg text-gray-500">{description}</p>
        )}

        {action && (
          <Link
            to={action.to}
            className="mt-6 rounded-xl bg-red-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-800"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
