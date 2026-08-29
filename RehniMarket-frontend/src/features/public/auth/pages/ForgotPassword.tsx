import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Mail } from "lucide-react";
import axios from "axios";

import { forgotPassword } from "@/features/public/auth/api/authService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import { Button, Input } from "@/shared/components/ui";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await forgotPassword({ email });

      navigate("/reset-password", { state: { email } });
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const error = err.response?.data?.detail;

        switch (error?.code) {
          case ErrorCode.EMAIL_NOT_FOUND:
          case ErrorCode.USER_NOT_FOUND:
          case ErrorCode.ACCOUNT_DISABLED:
            showAlert("error", error.message);
            break;

          case ErrorCode.EMAIL_NOT_VERIFIED:
            navigate("/verify-email", { state: { email } });
            break;

          default:
            showAlert(
              "error",
              error?.message ?? "No fue posible enviar el código de recuperación.",
            );
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
      icon={<KeyRound size={24} />}
      title="¿Olvidaste tu contraseña?"
      subtitle="Ingresa el correo de tu cuenta y te enviaremos un código para restablecerla."
      belowCard={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
        <Input
          label="Correo electrónico"
          type="email"
          required
          autoComplete="email"
          leadingIcon={<Mail size={18} />}
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Enviar código
        </Button>
      </form>
    </AuthLayout>
  );
}
