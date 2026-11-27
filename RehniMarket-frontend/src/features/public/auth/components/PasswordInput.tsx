/** Campo de contraseña de los formularios de acceso: candado, botón mostrar/ocultar accesible y el
 * resto de props del Input compartido (etiqueta, error, autocompletado). */
import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Input } from "@/shared/components/ui";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type" | "leadingIcon" | "trailingSlot">;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const [shown, setShown] = useState(false);

  return (
    <Input
      ref={ref}
      {...props}
      type={shown ? "text" : "password"}
      leadingIcon={<Lock size={18} />}
      trailingSlot={
        <button
          type="button"
          onClick={() => setShown((value) => !value)}
          aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={shown}
          className="rounded p-0.5 text-ink-muted transition hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
        >
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  );
});

export default PasswordInput;
