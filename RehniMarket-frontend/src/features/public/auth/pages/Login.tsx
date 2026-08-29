
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
import { consumePostLoginRedirect } from "@/api/session";

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

    setLoading(true);

    try {
      const res = await loginUser(form);

      login(res);

      // Si el usuario llegó acá redirigido desde una acción protegida
      // (carrito, checkout, un dashboard, etc. - ver
      // api/session.ts > setPostLoginRedirect) vuelve exactamente ahí;
      // si entró directo a /login (sin ningún destino guardado), sigue
      // yendo a inicio como antes (ver AUDITORÍA > CASO 5).
      const redirectTo = consumePostLoginRedirect();

      navigate(redirectTo || "/", { replace: true });
    } catch (err) {
      // Credenciales inválidas, rol no asignado, empresa pendiente/
      // rechazada, etc. ya se muestran mediante el sistema global de
      // alertas (ver api/Client.ts > handleApiError, que corre para
      // cualquier error de la API). Acá solo se maneja EMAIL_NOT_VERIFIED,
      // que además de mostrar el mensaje necesita redirigir.
      if (axios.isAxiosError(err)) {
        const errorResponse =
          err.response?.data?.detail;

        if (errorResponse?.code === ErrorCode.EMAIL_NOT_VERIFIED) {
          navigate("/verify-email", {
            state: {
              email: form.email,
              // Contadores calculados por el backend (ver
              // VerificationCodeState): el código ya fue (re)enviado como
              // parte de este login.
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

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">

          <h1 className="text-center text-3xl font-bold">
            Bienvenido
          </h1>

          <p className="mt-2 text-center text-gray-500">
            Inicia sesión para continuar
          </p>

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

