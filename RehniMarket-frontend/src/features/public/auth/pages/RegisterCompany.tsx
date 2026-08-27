import { useState } from "react";
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  FileText,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { registerCompany } from "@/features/public/auth/api/authService";
import TermsModal from "@/features/public/auth/components/TermsModal";
import CompanyTerms from "@/features/public/auth/components/terms/CompanyTerms";
import { useAlert } from "@/shared/components/alert/useAlert";

import { ErrorCode } from "@/shared/types/ErrorCode";

export default function CompanyForm() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [showTerms, setShowTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    tell: "",

    company_name: "",
    company_address: "",
    company_nit: "",
    company_nit_dv: "",
  });

  const [certificate, setCertificate] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setCertificate(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      showAlert("error", "Las contraseñas no coinciden.");
      return;
    }

    if (!certificate) {
      showAlert("error", "Debes adjuntar el certificado.");
      return;
    }

    try {
      setLoading(true);

      await registerCompany({
        ...form,
        certificate,
      });

      navigate("/verify-email", {
        state: {
          email: form.email,
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err.response?.data?.detail;

        switch (error?.code) {
          case ErrorCode.EMAIL_ALREADY_EXISTS:
            showAlert("error", error.message);
            break;

          case ErrorCode.NIT_ALREADY_EXISTS:
            showAlert("error", error.message);
            break;

          case ErrorCode.COMPANY_PENDING:
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">
            <div className="flex justify-center mb-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#6D0F2D]/10">
                <Building2 size={36} className="text-[#6D0F2D]" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-center">
              Registrar empresa
            </h1>

            <p className="text-center text-gray-500 mt-3 mb-10">
              Crea tu cuenta empresarial para vender productos en RehniMarket.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h2 className="font-bold text-xl mb-5">
                  Información del representante
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      type="text"
                      name="full_name"
                      placeholder="Nombre completo"
                      value={form.full_name}
                      onChange={handleChange}
                      required
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      type="text"
                      name="tell"
                      placeholder="Teléfono"
                      value={form.tell}
                      onChange={handleChange}
                      required
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      type="email"
                      name="email"
                      placeholder="Correo electrónico"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-bold text-xl mb-5">Seguridad</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Contraseña"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-12 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirmar contraseña"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-12 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-bold text-xl mb-5">
                  Información de la empresa
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      type="text"
                      name="company_name"
                      placeholder="Nombre de la empresa"
                      value={form.company_name}
                      onChange={handleChange}
                      required
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      type="text"
                      name="company_address"
                      placeholder="Dirección"
                      value={form.company_address}
                      onChange={handleChange}
                      required
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                    />
                  </div>

                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      type="text"
                      name="company_nit"
                      placeholder="NIT"
                      value={form.company_nit}
                      onChange={handleChange}
                      required
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-4 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                    />
                  </div>

                  <input
                    type="text"
                    name="company_nit_dv"
                    placeholder="DV"
                    value={form.company_nit_dv}
                    onChange={handleChange}
                    required
                    className="w-full h-14 rounded-2xl border border-gray-300 px-4 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                  />
                </div>
              </div>

              <div>
                <h2 className="font-bold text-xl mb-5">
                  Certificado Cámara de Comercio
                </h2>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-8 transition hover:border-[#6D0F2D]">
                  <Upload size={34} className="text-[#6D0F2D] mb-3" />

                  <p className="font-semibold">
                    {certificate ? certificate.name : "Seleccionar archivo PDF"}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    Solo archivos PDF
                  </p>

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFile}
                    hidden
                  />
                </label>
              </div>

              <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
              >
                <CompanyTerms />
              </TermsModal>

              <label className="flex items-center gap-3">
                <input type="checkbox" required />

                <span className="text-gray-600">
                  Acepto los{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-[#6D0F2D] font-semibold hover:underline"
                  >
                    términos y condiciones
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-[#6D0F2D] text-white text-lg font-semibold hover:bg-[#530A20] transition disabled:opacity-60"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta empresarial"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
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
        </div>
      </div>
  );
}
