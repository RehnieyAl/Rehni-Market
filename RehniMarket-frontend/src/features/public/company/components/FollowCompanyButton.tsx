/** Botón "Seguir tienda" / "Siguiendo" del perfil público. Visitante: va al login y vuelve a la tienda. */
import { Check, Loader2, Plus } from "lucide-react";

import { cn } from "@/shared/utils/cn";

interface FollowCompanyButtonProps {
  isFollowing: boolean;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
  className?: string;
}

export default function FollowCompanyButton({
  isFollowing,
  pending,
  disabled,
  onClick,
  className,
}: FollowCompanyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(
        "inline-flex h-11 min-w-40 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:opacity-60",
        isFollowing
          ? "border border-white/20 bg-white/5 text-ink hover:border-secondary/60 hover:bg-secondary/10"
          : "bg-primary text-white fill-hover",
        className,
      )}
    >
      {pending ? (
        <Loader2 size={16} aria-hidden="true" className="animate-spin" />
      ) : isFollowing ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <Plus size={16} aria-hidden="true" />
      )}
      {isFollowing ? (
        <>
          Siguiendo
          <span className="sr-only">. Pulsa para dejar de seguir esta tienda</span>
        </>
      ) : (
        "Seguir tienda"
      )}
    </button>
  );
}
