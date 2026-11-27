import { useState } from "react";
import { Mail, Phone, User, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { registerUser } from "@/features/public/auth/api/authService";
import TermsModal from "@/features/public/auth/components/TermsModal";
import UserTerms from "@/features/public/auth/components/terms/UserTerms";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import { lastPublicPath } from "@/features/public/auth/authNavigation";
import PasswordInput from "@/features/public/auth/components/PasswordInput";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { Button, Input } from "@/shared/components/ui";
import { registerUserSchema, useFormValidation } from "@/shared/validation";

export default function UserForm() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    tell: "",
  });

  const { errors, errorFor, touch, validateAll } = useFormValidation(registerUserSchema, {
    ...form,
    confirmPassword,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => touch(e.target.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) return;

    setLoading(true);

    try {
      const res = await registerUser(form);

      void navigate("/verify-email", {
        state: {
          email: form.email,
          expiresIn: res?.expires_in,
          resendAvailableIn: res?.resend_available_in,
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err.response?.data?.detail;

        switch (error?.code) {
          case ErrorCode.EMAIL_ALREADY_EXISTS:
          case ErrorCode.ROLE_NOT_FOUND:
            showAlert("error", error.message);
            break;

          default:
            showAlert("error", error?.message ?? "Ocurrió un error.");
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
      icon={<UserPlus size={28} />}
      backFallback={lastPublicPath()}
      title="Crear una cuenta"
      subtitle="Únete a RehniMarket para comprar y guardar tus favoritos."
      belowCard={
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="font-semibold brand-link">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-ink-muted">
            Datos personales
          </legend>

          <Input
            label="Nombre completo"
            name="full_name"
            required
            autoComplete="name"
            leadingIcon={<User size={18} />}
            placeholder="Tu nombre completo"
            value={form.full_name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errorFor("full_name")}
          />

          <Input
            label="Teléfono"
            name="tell"
            type="tel"
            required
            autoComplete="tel"
            leadingIcon={<Phone size={18} />}
            placeholder="Número de contacto"
            value={form.tell}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errorFor("tell")}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-ink-muted">
            Datos de acceso
          </legend>

          <Input
            label="Correo electrónico"
            name="email"
            type="email"
            required
            autoComplete="email"
            leadingIcon={<Mail size={18} />}
            placeholder="correo@ejemplo.com"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errorFor("email")}
          />

          <PasswordInput
            label="Contraseña"
            name="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errorFor("password")}
            hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
          />

          <PasswordInput
            label="Confirmar contraseña"
            name="confirmPassword"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={handleBlur}
            // La no coincidencia se avisa mientras se escribe, como antes.
            error={errorFor("confirmPassword") ?? (confirmPassword ? errors.confirmPassword : undefined)}
          />
        </fieldset>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 accent-secondary"
          />
          <span className="leading-relaxed text-ink-muted">
            Acepto los{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="font-semibold brand-link"
            >
              términos y condiciones
            </button>
          </span>
        </label>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)}>
        <UserTerms />
      </TermsModal>
    </AuthLayout>
  );
}
