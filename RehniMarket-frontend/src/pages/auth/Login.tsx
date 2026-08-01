import { useState } from "react";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/useAuth";


import { ErrorCode } from "../../types/ErrorCode";
import axios from "axios";

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
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await loginUser(form);

      login(res);

      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)){
        const error = err.response?.data?.detail;

        switch (error?.code){
          case ErrorCode.INVALID_CREDENTIALS:
          setError(error.message);
          break;

          case ErrorCode.EMAIL_NOT_VERIFIED:
            navigate("/verify-email", {
            state: {
              email: form.email,
            },
          });
          break;

          case ErrorCode.ROLE_NOT_ASSIGNED:
            setError(error.message)
            break;

          case ErrorCode.COMPANY_PENDING:
            setError(error.message);
            break;

        case ErrorCode.COMPANY_REJECTED:
          setError(error.message);
          break;

        default:
          setError(error.message);
          break;

        }
      } else {
        alert("Ocurrio un error")
      }


    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">

          <h1 className="text-3xl font-bold text-center">
            Bienvenido
          </h1>

          <p className="text-gray-500 text-center mt-2">
            Inicia sesión para continuar
          </p>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5 mt-8"
            autoComplete="off"
          >

            <div>

              <label className="block text-sm font-medium mb-2">
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
                  className="w-full h-12 rounded-xl border border-gray-300 pl-11 pr-4 outline-none transition focus:border-[#6D0F2D] focus:ring-2 focus:ring-[#6D0F2D]/20"
                />

              </div>

            </div>

            <div>

              <label className="block text-sm font-medium mb-2">
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
                  className="w-full h-12 rounded-xl border border-gray-300 pl-11 pr-12 outline-none transition focus:border-[#6D0F2D] focus:ring-2 focus:ring-[#6D0F2D]/20"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
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

            <div className="flex justify-end">

              <Link
                to="/forgot-password"
                className="text-sm text-[#6D0F2D] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#6D0F2D] text-white font-semibold hover:bg-[#530A20] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? "Iniciando sesión..."
                : "Iniciar sesión"}
            </button>

          </form>

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