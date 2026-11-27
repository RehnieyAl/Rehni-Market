// Monta la aplicación completa (providers y rutas reales) en una URL, con la sesión del rol
// indicado y la red sustituida por `mockApi`.
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import App from "@/App";
import { AuthProvider } from "@/features/public/auth/context/AuthProvider";
import { CartProvider } from "@/features/cart/context/CartProvider";
import { FavoritesProvider } from "@/features/favorites/context/FavoritesProvider";
import AlertProvider from "@/shared/components/alert/AlertProvider";
import type { Role } from "@/features/public/auth/types/auth";

import { mockApi } from "./http";

export const EMPTY_CART = {
  id: "cart-1",
  items: [],
  subtotal: "0",
  tax: "0",
  total: "0",
  totalItems: 0,
};

export function profileFor(role: Role) {
  return {
    email: `${role}@rehni.test`,
    name: `Cuenta ${role}`,
    role,
    tell: "3001234567",
    profileImagen: null,
  };
}

interface Options {
  role?: Role;
  routes?: Record<string, unknown>;
}

export function renderApp(path: string, { role, routes = {} }: Options = {}) {
  if (role) {
    localStorage.setItem("accessToken", `access-${role}`);
    localStorage.setItem("refreshToken", `refresh-${role}`);
  }
  // El aviso móvil cubre la parte inferior; aquí estorba a las consultas.
  localStorage.setItem("rm_mobile_notice_dismissed", "1");
  window.history.pushState({}, "", path);

  const http = mockApi({
    ...(role ? { "GET /auth/me": profileFor(role) } : {}),
    "GET /cart": EMPTY_CART,
    "GET /favorites": [],
    ...routes,
  });

  const view = render(
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <AlertProvider>
            <App />
          </AlertProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>,
  );

  return { ...view, http };
}

/**
 * Monta un componente suelto dentro de los mismos providers que la app, con un router en
 * memoria. Útil para modales y vistas que reciben props.
 */
export function renderWithProviders(
  ui: ReactElement,
  { role, routes = {}, path = "/" }: Options & { path?: string | { pathname: string; state?: unknown } } = {},
) {
  if (role) {
    localStorage.setItem("accessToken", `access-${role}`);
    localStorage.setItem("refreshToken", `refresh-${role}`);
  }
  const http = mockApi({
    ...(role ? { "GET /auth/me": profileFor(role) } : {}),
    "GET /cart": EMPTY_CART,
    "GET /favorites": [],
    ...routes,
  });

  const view = render(
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <AlertProvider>
            <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
          </AlertProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>,
  );

  return { ...view, http };
}
