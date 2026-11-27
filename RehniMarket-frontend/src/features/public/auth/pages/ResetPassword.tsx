/** Nueva contraseña con el código de recuperación, con reenvío del código sin repetir la solicitud. */
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { forgotPassword, resetPassword } from "@/features/public/auth/api/authService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import PasswordInput from "@/features/public/auth/components/PasswordInput";
import OtpInput from "@/features/public/auth/components/OtpInput";
import ResendCode from "@/features/public/auth/components/ResendCode";
import { Button } from "@/shared/components/ui";

const EMAIL_KEY = "resetPassword.email";

function rememberedEmail(): string {
  try {
    return sessionStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();

  const navState = (location.state ?? {}) as { email?: string; resendAvailableIn?: number };
  const email = navState.email ?? rememberedEmail();

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [focusKey, setFocusKey] = useState(0);

  useEffect(() => {
    if (!email) return;
    try {
      sessionStorage.setItem(EMAIL_KEY, email);
    } catch {
      // Sin sessionStorage solo se pierde el correo al recargar.
    }
  }, [email]);

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
      void navigate("/login", { state: { email } });
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const error = err.response?.data?.detail;

        switch (error?.code) {
          case ErrorCode.CODE_EXPIRED:
          case ErrorCode.INVALID_CODE:
          case ErrorCode.CODE_ATTEMPTS_EXCEEDED:
            showAlert("error", error.message);
            setCode(["", "", "", "", "", ""]);
            setFocusKey((key) => key + 1);
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


  return (
    <AuthLayout
      icon={<ShieldCheck size={28} />}
      title="Nueva contraseña"
      subtitle={
        <>
          Ingresa el código de verificación que enviamos a{" "}
          <span className="font-medium text-ink [overflow-wrap:anywhere]">{email || "tu correo"}</span> y crea una
          contraseña nueva.
        </>
      }
      backFallback="/forgot-password"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Código de 6 dígitos</p>
          <OtpInput value={code} onChange={setCode} autoFocusKey={focusKey} ariaLabel="Código de recuperación" />
        </div>

        <PasswordInput
          label="Nueva contraseña"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <PasswordInput
          label="Confirmar contraseña"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword && password !== confirmPassword ? "Las contraseñas no coinciden." : undefined}
        />

        <ResendCode
          email={email}
          availableIn={navState.resendAvailableIn}
          onResend={() => forgotPassword({ email })}
          onResent={() => {
            setCode(["", "", "", "", "", ""]);
            setFocusKey((key) => key + 1);
          }}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Guardar nueva contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}
