
import { useState } from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import { loginUser } from "@/features/public/auth/api/authService";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { ErrorCode } from "@/shared/types/ErrorCode";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showPassword, setShowPassword] =
    useState(false);

  const [form, setForm] = useState({
    email: location.state?.email ?? "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await loginUser(form);

      login(res);

      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorResponse =
          err.response?.data?.detail;

        switch (errorResponse?.code) {
          case ErrorCode.EMAIL_NOT_VERIFIED:
            navigate("/verify-email", {
              state: {
                email: form.email,
              },
            });
            break;

          case ErrorCode.INVALID_CREDENTIALS:
          case ErrorCode.ROLE_NOT_ASSIGNED:
          case ErrorCode.COMPANY_PENDING:
          case ErrorCode.COMPANY_REJECTED:
            setError(
              errorResponse?.message ??
                "No se pudo iniciar sesión.",
            );
            break;

          default:
            // Los demás errores son manejados
            // por el sistema global de alertas.
            break;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
      <div className="w-full max-w-md">

        {/* Volver a inicio */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#6D0F2D]"
        >
          <ArrowLeft size={18} />
          <span>Volver a inicio</span>
        </button>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">

          <h1 className="text-center text-3xl font-bold">
            Bienvenido
          </h1>

          <p className="mt-2 text-center text-gray-500">
            Inicia sesión para continuar
          </p>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
            autoComplete="off"
          >

            {/* Correo */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Correo electrónico
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  name="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-gray-300 pl-11 pr-4 outline-none transition focus:border-[#6D0F2D] focus:ring-2 focus:ring-[#6D0F2D]/20"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Contraseña
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-gray-300 pl-11 pr-12 outline-none transition focus:border-[#6D0F2D] focus:ring-2 focus:ring-[#6D0F2D]/20"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Recuperar contraseña */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-[#6D0F2D] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#6D0F2D] font-semibold text-white transition hover:bg-[#530A20] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Iniciando sesión..."
                : "Iniciar sesión"}
            </button>

          </form>

          {/* Registro */}
          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">
              ¿No tienes una cuenta?
            </span>

            <Link
              to="/register-user"
              className="ml-2 font-semibold text-[#6D0F2D] hover:underline"
            >
              Crear cuenta
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

