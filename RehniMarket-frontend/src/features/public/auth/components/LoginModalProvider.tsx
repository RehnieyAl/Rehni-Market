/** Modal de inicio de sesión sobre la página actual: fondo desenfocado, la URL (búsqueda, filtros y
 * hash) no cambia y, al entrar, el usuario sigue en la misma página con los permisos de su sesión. */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { LogIn, X } from "lucide-react";

import { clearAuthArtifacts } from "@/api/session";
import { Modal } from "@/shared/components/ui";

import { LoginModalContext } from "../context/LoginModalContext";
import AuthHeader from "./AuthHeader";
import LoginForm from "./LoginForm";

export default function LoginModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openLogin = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const handleSuccess = useCallback(() => {
    // Desde una página pública no hay destino pendiente: un deep link viejo no debe sacar al usuario.
    clearAuthArtifacts();
    setOpen(false);
  }, []);

  const value = useMemo(() => ({ openLogin }), [openLogin]);

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      <Modal
        isOpen={open}
        onClose={close}
        hideClose
        size="sm"
        backdrop="blur"
        ariaLabel="Iniciar sesión"
        className="relative rounded-[28px] border border-white/[0.06]"
      >
        <div className="px-1 pb-2 pt-6 sm:px-3">
          <AuthHeader
            icon={<LogIn size={26} />}
            title="Iniciar sesión"
            subtitle="Ingresa con tu cuenta de RehniMarket."
          />
          <div className="mt-7">
            {open && <LoginForm onSuccess={handleSuccess} onLeave={close} />}
          </div>
        </div>
        {/* Al final del DOM: el foco inicial va al correo y no a cerrar. */}
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-white/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </Modal>
    </LoginModalContext.Provider>
  );
}
