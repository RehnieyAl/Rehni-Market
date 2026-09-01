import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { loginUser } from "@/features/public/auth/api/authService";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { consumePostLoginRedirect } from "@/api/session";
import {
  isPathAllowedForRole,
  resolveRoleHome,
} from "@/features/public/auth/roleAccess";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import { Button, Input } from "@/shared/components/ui";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: location.state?.email ?? "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await loginUser(form);

      await login(res);

      const requestedPath = consumePostLoginRedirect();
      const target =
        requestedPath && isPathAllowedForRole(requestedPath, res.role)
          ? requestedPath
          : resolveRoleHome(res.role);

      navigate(target, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorResponse = err.response?.data?.detail;

        if (errorResponse?.code === ErrorCode.EMAIL_NOT_VERIFIED) {
          navigate("/verify-email", {
            state: {
              email: form.email,
              expiresIn: errorResponse.expires_in,
              resendAvailableIn: errorResponse.resend_available_in,
            },
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para continuar en RehniMarket."
      belowCard={
        <p>
          ¿No tienes una cuenta?{" "}
          <Link to="/register-user" className="font-semibold text-primary hover:underline">
            Crear cuenta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          required
          autoComplete="email"
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
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="rounded p-0.5 text-gray-400 transition hover:text-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  );
}
