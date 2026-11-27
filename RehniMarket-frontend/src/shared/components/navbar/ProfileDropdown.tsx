/** Menú desplegable de perfil del navbar de escritorio: secciones del panel según el rol y cierre de sesión. */
import { cloneElement, type ReactElement } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/features/public/auth/context/useAuth";
import { useSignOut } from "@/features/public/auth/hooks/useSignOut";
import { Skeleton } from "@/shared/components/ui";
import { getAccountLinks, ROLE_NAME } from "./accountLinks";
import NavDropdown from "./NavDropdown";

const ITEM_CLASS =
  "flex items-center gap-3 rounded-control px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900";

interface ProfileDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDropdown({ open, onOpenChange }: ProfileDropdownProps) {
  const { role, user } = useAuth();
  const signOut = useSignOut();

  if (!role) return null;

  const { sections: navItems, settings: settingsItem } = getAccountLinks(role);
  const displayName = user?.name ?? ROLE_NAME[role];
  const initial = displayName.charAt(0).toUpperCase();
  const close = () => onOpenChange(false);

  const avatar = (sizeClass: string) => (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-fg ${sizeClass}`}
    >
      {user?.profileImagen ? (
        <img src={user.profileImagen} alt={displayName} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );

  return (
    <NavDropdown
      id="profile-menu"
      open={open}
      onOpenChange={onOpenChange}
      // En lg el nombre se oculta para dejar sitio al buscador; la etiqueta conserva el texto visible de xl.
      triggerLabel={`${displayName}, ${ROLE_NAME[role]}`}
      panelLabel="Menú de perfil"
      panelClassName="w-72"
      triggerClassName="flex items-center gap-3 rounded-control px-2 py-1.5 transition-colors hover:bg-white/5"
      trigger={
        <>
          {avatar("h-10 w-10 text-sm")}

          <div className="hidden min-w-0 text-left xl:block">
            {user?.name ? (
              <p className="max-w-[150px] truncate text-sm font-semibold text-ink">{user.name}</p>
            ) : (
              <Skeleton className="h-3.5 w-20" />
            )}
            <p className="text-xs text-ink-muted">{ROLE_NAME[role]}</p>
          </div>

          <ChevronDown
            size={17}
            aria-hidden="true"
            className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </>
      }
    >
      <div className="bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          {avatar("h-12 w-12 text-lg")}

          <div className="min-w-0">
            {user?.name ? (
              <p className="truncate font-semibold text-gray-900">{user.name}</p>
            ) : (
              <Skeleton className="h-4 w-32" />
            )}
            <p className="truncate text-sm text-gray-500">{user?.email ?? ""}</p>
            <p className="mt-1 text-xs font-medium text-ink-muted">{ROLE_NAME[role]}</p>
          </div>
        </div>
      </div>

      <div className="p-2">
        {navItems.map((item) => (
          <Link key={item.id} to={item.to} onClick={close} className={ITEM_CLASS}>
            {cloneElement(item.icon as ReactElement<{ size?: number }>, { size: 18 })}
            <span>{item.text}</span>
          </Link>
        ))}

        {settingsItem && (
          <>
            <div className="my-2 h-px bg-gray-100" />
            <Link to={settingsItem.to} onClick={close} className={ITEM_CLASS}>
              {cloneElement(settingsItem.icon as ReactElement<{ size?: number }>, { size: 18 })}
              <span>{settingsItem.text}</span>
            </Link>
          </>
        )}

        <div className="my-2 h-px bg-gray-100" />

        <button
          type="button"
          onClick={() => {
            close();
            signOut();
          }}
          className="flex w-full items-center gap-3 rounded-control px-3 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-bg"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </NavDropdown>
  );
}
