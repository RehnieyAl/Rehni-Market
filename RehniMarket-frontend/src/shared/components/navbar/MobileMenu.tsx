// Menú móvil de la tienda: panel de altura completa con navegación, cuenta (acordeón por rol)
// y acciones rápidas. Se monta en un portal para quedar por encima del header fijo.
import { cloneElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  House,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  ShoppingCart,
  Sparkles,
  Tag,
  UserRound,
  X,
} from "lucide-react";

import logo from "@/assets/logo.png";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { useSignOut } from "@/features/public/auth/hooks/useSignOut";
import { useLoginModal } from "@/features/public/auth/context/LoginModalContext";
import { useCart } from "@/features/cart/context/useCart";
import { cn } from "@/shared/utils/cn";
import { getAccountLinks, ROLE_NAME } from "./accountLinks";

export interface StoreNavItem {
  label: string;
  to: string;
  isActive: (pathname: string) => boolean;
}

const STORE_ICONS: Record<string, ReactNode> = {
  "/": <House size={20} />,
  "/categories": <LayoutGrid size={20} />,
  "/products": <Package size={20} />,
  "/offers": <Tag size={20} />,
  "/new": <Sparkles size={20} />,
};

interface MobileMenuProps {
  open: boolean;
  items: StoreNavItem[];
  onClose: () => void;
}

const rowClass = (active: boolean) =>
  cn(
    "relative flex min-h-12 items-center gap-4 rounded-control px-4 text-[15px] font-medium transition",
    active
      ? "bg-primary text-white"
      : "text-ink hover:bg-white/5",
  );

export default function MobileMenu({ open, items, onClose }: MobileMenuProps) {
  const { role, user } = useAuth();
  const signOut = useSignOut();
  const loginModal = useLoginModal();
  const { cart } = useCart();
  const location = useLocation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const account = role ? getAccountLinks(role) : null;
  const displayName = user?.name ?? (role ? ROLE_NAME[role] : "");
  const isBuyer = role === "user";

  const handleLogout = () => {
    onClose();
    signOut();
  };

  const quickActions = account
    ? isBuyer
      ? [
          { to: "/user/dashboard?tab=favorites", label: "Favoritos", icon: <Heart size={20} /> },
          { to: "/cart", label: "Carrito", icon: <ShoppingCart size={20} />, badge: cart?.totalItems },
          { to: account.basePath, label: "Mi cuenta", icon: <UserRound size={20} /> },
        ]
      : [{ to: account.basePath, label: "Mi panel", icon: <LayoutDashboard size={20} /> }]
    : [];

  return createPortal(
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menú principal"
      className="fixed inset-0 z-[70] flex justify-end bg-black/60 lg:hidden"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-dvh w-full flex-col bg-surface-1 text-ink sm:max-w-sm sm:border-l sm:border-hairline">
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-hairline px-4">
          <Link to="/" onClick={onClose} className="flex min-w-0 items-center">
            <img src={logo} alt="RehniMarket" className="h-9 w-auto object-contain" />
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <nav aria-label="Tienda" className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                aria-current={item.isActive(location.pathname) ? "page" : undefined}
                className={rowClass(item.isActive(location.pathname))}
              >
                <span className="shrink-0 text-ink-muted">{STORE_ICONS[item.to]}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="my-4 border-t border-hairline" />

          {!role || !account ? (
            <div className="flex flex-col gap-3 px-1">
              <Link
                to="/login"
                aria-haspopup="dialog"
                onClick={(event) => {
                  onClose();
                  if (loginModal) {
                    event.preventDefault();
                    loginModal.openLogin();
                  }
                }}
                className="flex min-h-12 items-center justify-center rounded-control border border-hairline text-sm font-medium text-ink transition hover:bg-white/5"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register-user"
                onClick={onClose}
                className="flex min-h-12 items-center justify-center rounded-control bg-primary text-sm font-medium text-white transition-shadow fill-hover"
              >
                Registrarse
              </Link>
            </div>
          ) : (
            <section aria-label="Mi cuenta">
              <p className="mb-2 px-2 text-xs font-semibold text-ink-muted">
                Mi cuenta
              </p>

              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                aria-expanded={accountOpen}
                aria-controls="mobile-account-links"
                className="flex w-full items-center gap-3 rounded-card border border-hairline bg-surface-2 p-3 text-left transition hover:bg-surface-3"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-base font-semibold text-primary-fg">
                  {user?.profileImagen ? (
                    <img src={user.profileImagen} alt="" className="h-full w-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{displayName}</span>
                  <span className="block truncate text-sm text-ink-muted">{ROLE_NAME[role]}</span>
                </span>
                <ChevronDown
                  size={20}
                  className={cn("shrink-0 text-ink-muted transition-transform", accountOpen && "rotate-180")}
                />
              </button>

              {accountOpen && (
                <div id="mobile-account-links" className="mt-2 flex flex-col gap-1 pl-2">
                  {account.sections.map((section) => (
                    <Link
                      key={section.id}
                      to={section.to}
                      onClick={onClose}
                      className={rowClass(false)}
                    >
                      {cloneElement(section.icon as ReactElement<{ size?: number }>, { size: 20 })}
                      {section.id === "home" ? "Panel de inicio" : section.text}
                    </Link>
                  ))}

                  {account.settings && (
                    <>
                      <div className="my-2 border-t border-hairline" />
                      <Link
                        to={account.settings.to}
                        onClick={onClose}
                        className={rowClass(false)}
                      >
                        {cloneElement(account.settings.icon as ReactElement<{ size?: number }>, { size: 20 })}
                        {account.settings.text}
                      </Link>
                    </>
                  )}

                  <div className="my-2 border-t border-hairline" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-12 items-center gap-4 rounded-control px-4 text-left text-[15px] font-medium text-ink transition-colors hover:bg-white/5"
                  >
                    <LogOut size={20} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        {quickActions.length > 0 && (
          <nav
            aria-label="Accesos rápidos"
            className="grid shrink-0 auto-cols-fr grid-flow-col border-t border-hairline bg-surface-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
          >
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                onClick={onClose}
                className="relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-control text-xs font-medium text-ink-muted transition hover:bg-white/5 hover:text-ink"
              >
                {action.icon}
                {action.label}
                {!!action.badge && (
                  <span className="absolute right-1/4 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-white">
                    {action.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>,
    document.body,
  );
}
