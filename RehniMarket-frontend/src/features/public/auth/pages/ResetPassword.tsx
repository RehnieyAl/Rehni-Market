import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { resetPassword } from "@/features/public/auth/api/authService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import OtpInput from "@/features/public/auth/components/OtpInput";
import { Button, Input } from "@/shared/components/ui";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();

  const email = location.state?.email ?? "";

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showAlert("error", "Las contraseñas no coinciden.");
      return;
    }

    if (code.join("").length !== 6) {
      showAlert("error", "Ingresa el código completo.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        email,
        code: code.join(""),
        new_password: password,
      });

      showAlert("success", "Contraseña actualizada correctamente.");
      navigate("/login", { state: { email } });
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const error = err.response?.data?.detail;

        switch (error?.code) {
          case ErrorCode.CODE_EXPIRED:
          case ErrorCode.INVALID_CODE:
          case ErrorCode.CODE_ALREADY_USED:
          case ErrorCode.USER_NOT_FOUND:
            showAlert("error", error.message);
            break;

          default:
            showAlert("error", error?.message ?? "Ocurrió un error inesperado.");
            break;
        }
      } else {
        showAlert("error", "Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const eyeButton = (shown: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="rounded p-0.5 text-gray-400 transition hover:text-primary"
    >
      {shown ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <AuthLayout
      icon={<ShieldCheck size={24} />}
      title="Nueva contraseña"
      subtitle={
        <>
          Ingresa el código enviado a{" "}
          <span className="font-medium text-gray-700">{email}</span> y crea una
          contraseña nueva.
        </>
      }
      belowCard={
        <Link
          to="/login"
          state={{ email }}
          className="font-semibold text-primary hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Código de 6 dígitos</p>
          <OtpInput value={code} onChange={setCode} ariaLabel="Código de recuperación" />
        </div>

        <Input
          label="Nueva contraseña"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          leadingIcon={<Lock size={18} />}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailingSlot={eyeButton(showPassword, () => setShowPassword((v) => !v))}
        />

        <Input
          label="Confirmar contraseña"
          type={showConfirmPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          leadingIcon={<Lock size={18} />}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={
            confirmPassword && password !== confirmPassword
              ? "Las contraseñas no coinciden."
              : undefined
          }
          trailingSlot={eyeButton(showConfirmPassword, () =>
            setShowConfirmPassword((v) => !v),
          )}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Guardar nueva contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}
