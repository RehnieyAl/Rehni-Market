import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { registerUser } from "@/features/public/auth/api/authService";

import TermsModal from "@/features/public/auth/components/TermsModal";
import UserTerms from "@/features/public/auth/components/terms/UserTerms";

import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";

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
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
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
            showAlert("error", error.message);
            break;

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h1 className="text-4xl font-bold text-center text-gray-900">
              Crear una cuenta
            </h1>

            <p className="text-center text-gray-500 mt-3 mb-8">
              Únete a RehniMarket para comenzar.
            </p>

            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Nombre completo
                </label>

                <div className="relative">
                  <User
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="full_name"
                    required
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Tu nombre completo"
                    className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none transition focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                  />
                </div>
              </div>

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
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="RehnieyAl@ejemplo.com"
                    className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none transition focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2">
                    Teléfono
                  </label>

                  <div className="relative">
                    <Phone
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      name="tell"
                      required
                      value={form.tell}
                      onChange={handleChange}
                      placeholder="Tu número de teléfono"
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none transition focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Contraseña
                </label>

                <div className="relative">
                  <Lock
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-12 outline-none transition focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6D0F2D]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Confirmar contraseña
                </label>

                <div className="relative">
                  <Lock
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-12 outline-none transition focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6D0F2D]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
              >
                <UserTerms />
              </TermsModal>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 accent-[#6D0F2D]"
                />

                <span className="text-gray-600 leading-relaxed">
                  Acepto los{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="font-semibold text-[#6D0F2D] hover:underline"
                  >
                    términos y condiciones
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-[#6D0F2D] text-white font-semibold text-lg hover:bg-[#530A20] transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#6D0F2D] hover:underline"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            © 2025 RehniMarket. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
