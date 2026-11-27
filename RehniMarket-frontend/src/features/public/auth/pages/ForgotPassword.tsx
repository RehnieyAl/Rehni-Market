/** Solicitud del código de recuperación. La respuesta es la misma exista o no la cuenta. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Mail } from "lucide-react";
import axios from "axios";

import { forgotPassword } from "@/features/public/auth/api/authService";
import { useAlert } from "@/shared/components/alert/useAlert";
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
      const state = await forgotPassword({ email });

      void navigate("/reset-password", {
        state: { email, expiresIn: state.expires_in, resendAvailableIn: state.resend_available_in },
      });
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.detail?.message : undefined;
      showAlert("error", message ?? "No fue posible enviar el código de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={<KeyRound size={28} />}
      title="¿Olvidaste tu contraseña?"
      subtitle="Ingresa el correo de tu cuenta y te enviaremos un código para restablecerla."
      backFallback="/login"
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
