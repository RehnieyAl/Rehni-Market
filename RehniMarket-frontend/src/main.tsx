
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

import { AuthProvider } from "@/features/public/auth/context/AuthProvider";
import { CartProvider } from "@/features/cart/context/CartProvider";
import AlertProvider from "@/shared/components/alert/AlertProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <AlertProvider>
          <App />
        </AlertProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
);

