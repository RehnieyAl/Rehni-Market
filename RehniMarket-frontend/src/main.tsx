
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "@fontsource-variable/inter";
import "./index.css";

import { AuthProvider } from "@/features/public/auth/context/AuthProvider";
import { CartProvider } from "@/features/cart/context/CartProvider";
import { FavoritesProvider } from "@/features/favorites/context/FavoritesProvider";
import AlertProvider from "@/shared/components/alert/AlertProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <AlertProvider>
            <App />
          </AlertProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
);

