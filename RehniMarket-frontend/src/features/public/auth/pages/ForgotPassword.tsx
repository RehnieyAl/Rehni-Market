import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { forgotPassword } from "@/features/public/auth/api/authService";
import axios from "axios";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await forgotPassword({
        email,
      });

      navigate("/reset-password", {
        state: {
          email,
        },
      });
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const error = err.response?.data?.detail;

        switch (error?.code) {
          case ErrorCode.EMAIL_NOT_FOUND:
            showAlert("error", error.message);
            break;

          case ErrorCode.USER_NOT_FOUND:
            showAlert("error", error.message);
            break;

          case ErrorCode.EMAIL_NOT_VERIFIED:
            navigate("/verify-email", {
              state: {
                email,
              },
            });
            break;

          case ErrorCode.ACCOUNT_DISABLED:
            showAlert("error", error.message);
            break;

          default:
            showAlert(
              "error",
              error?.message ??
                "No fue posible enviar el código de recuperación.",
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6D0F2D]/10">
              <Mail size={30} className="text-[#6D0F2D]" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900">
            ¿Olvidaste tu contraseña?
          </h1>

          <p className="text-center text-gray-500 mt-3 mb-8 leading-relaxed">
            No te preocupes.
            <br />
            Ingresa el correo asociado a tu cuenta y te enviaremos un código
            para restablecer tu contraseña.
          </p>

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold mb-2">
                Correo electrónico
              </label>

              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none transition focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-[#6D0F2D] text-white font-semibold text-lg hover:bg-[#530A20] transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200"></div>

              <span className="text-sm text-gray-400">o</span>

              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <Link
              to="/login"
              className="font-semibold text-[#6D0F2D] hover:underline"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
