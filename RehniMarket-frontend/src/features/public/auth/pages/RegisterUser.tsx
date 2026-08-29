import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { registerUser } from "@/features/public/auth/api/authService";
import TermsModal from "@/features/public/auth/components/TermsModal";
import UserTerms from "@/features/public/auth/components/terms/UserTerms";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { Button, Input } from "@/shared/components/ui";

export default function UserForm() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    tell: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== confirmPassword) {
      showAlert("error", "Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await registerUser(form);

      navigate("/verify-email", {
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
      title="Crear una cuenta"
      subtitle="Únete a RehniMarket para comprar y guardar tus favoritos."
      belowCard={
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
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
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
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
          />

          <Input
            label="Contraseña"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            leadingIcon={<Lock size={18} />}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
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
              confirmPassword && form.password !== confirmPassword
                ? "Las contraseñas no coinciden."
                : undefined
            }
            trailingSlot={eyeButton(showConfirmPassword, () =>
              setShowConfirmPassword((v) => !v),
            )}
          />
        </fieldset>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          <span className="leading-relaxed text-gray-600">
            Acepto los{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="font-semibold text-primary hover:underline"
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
