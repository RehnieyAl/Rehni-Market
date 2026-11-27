/** Formulario único de inicio de sesión (modal y página /login). Autentica, deja la sesión en el
 * AuthProvider y avisa a quien lo usa; el destino posterior lo decide el contenedor. */
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { loginUser } from "@/features/public/auth/api/authService";
import { useAuth } from "@/features/public/auth/context/useAuth";
import type { Role } from "@/features/public/auth/types/auth";
import CertificateRejectedModal from "@/features/company/components/CertificateRejectedModal";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { Button, Input } from "@/shared/components/ui";

interface LoginFormProps {
  initialEmail?: string;
  onSuccess: (role: Role) => void;
  /** Se llama antes de salir del formulario hacia otra pantalla del acceso (registro, recuperación,
   * verificación): el modal se cierra; la página no necesita hacer nada. */
  onLeave?: () => void;
}

export default function LoginForm({ initialEmail = "", onSuccess, onLeave }: LoginFormProps) {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [form, setForm] = useState({ email: initialEmail, password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Empresa con certificado NEEDS_UPDATE o REJECTED: credenciales correctas pero sin JWT ni sesión.
  const [certReason, setCertReason] = useState<string | null>(null);
  const [certNoticeStatus, setCertNoticeStatus] = useState<"needs_update" | "rejected" | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await loginUser(form);
      await login(res);
      onSuccess(res.role);
    } catch (err) {
      // El mensaje de credenciales inválidas lo muestra la alerta global del cliente HTTP.
      if (!axios.isAxiosError(err)) return;
      const detail = err.response?.data?.detail;

      if (detail?.code === ErrorCode.EMAIL_NOT_VERIFIED) {
        onLeave?.();
        void navigate("/verify-email", {
          state: {
            email: form.email,
            expiresIn: detail.expires_in,
            resendAvailableIn: detail.resend_available_in,
          },
        });
      } else if (
        detail?.code === ErrorCode.COMPANY_CERTIFICATE_INVALID ||
        detail?.code === ErrorCode.COMPANY_REJECTED
      ) {
        logout();
        setCertReason(typeof detail.reason === "string" ? detail.reason : null);
        setCertNoticeStatus(detail.code === ErrorCode.COMPANY_REJECTED ? "rejected" : "needs_update");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          leadingIcon={<Mail size={18} />}
          placeholder="correo@ejemplo.com"
          value={form.email}
          onChange={handleChange}
        />

        <div>
          <Input
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            leadingIcon={<Lock size={18} />}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            trailingSlot={
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                className="rounded p-0.5 text-ink-muted transition hover:text-secondary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="mt-2 text-right">
            <Link to="/forgot-password" onClick={onLeave} className="text-sm font-medium brand-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Iniciar sesión
        </Button>

        <p className="text-center text-sm text-ink-muted">
          ¿No tienes una cuenta?{" "}
          <Link to="/register-user" onClick={onLeave} className="font-semibold brand-link">
            Crear cuenta
          </Link>
        </p>
      </form>

      <CertificateRejectedModal
        status={certNoticeStatus}
        reason={certReason}
        onClose={() => setCertNoticeStatus(null)}
      />
    </>
  );
}
