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
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { Button, Input } from "@/shared/components/ui";

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
    setForm((prev) => ({ ...prev, [name]: value }));
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

      const res = await registerCompany({ ...form, certificate });

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
          case ErrorCode.NIT_ALREADY_EXISTS:
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

  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <AuthLayout
      size="lg"
      icon={<Building2 size={26} />}
      title="Registrar empresa"
      subtitle="Crea tu cuenta empresarial para vender productos en RehniMarket."
      belowCard={
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Representante
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre completo"
              name="full_name"
              required
              autoComplete="name"
              leadingIcon={<User size={18} />}
              placeholder="Nombre del representante"
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
            <Input
              className="sm:col-span-2"
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
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Contraseña
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
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
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              leadingIcon={<Lock size={18} />}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              error={passwordsMismatch ? "Las contraseñas no coinciden." : undefined}
              trailingSlot={eyeButton(showConfirmPassword, () =>
                setShowConfirmPassword((v) => !v),
              )}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Datos de la empresa
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre de la empresa"
              name="company_name"
              required
              leadingIcon={<Building2 size={18} />}
              placeholder="Razón social"
              value={form.company_name}
              onChange={handleChange}
            />
            <Input
              label="Dirección"
              name="company_address"
              required
              leadingIcon={<MapPin size={18} />}
              placeholder="Dirección de la empresa"
              value={form.company_address}
              onChange={handleChange}
            />
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <Input
                label="NIT"
                name="company_nit"
                required
                leadingIcon={<FileText size={18} />}
                placeholder="900123456"
                value={form.company_nit}
                onChange={handleChange}
              />
              <Input
                label="DV"
                name="company_nit_dv"
                required
                placeholder="0"
                value={form.company_nit_dv}
                onChange={handleChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Certificado de Cámara de Comercio
          </legend>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
            <Upload size={26} className="text-primary" />
            <p className="text-sm font-medium text-gray-900">
              {certificate ? certificate.name : "Seleccionar archivo PDF"}
            </p>
            <p className="text-xs text-gray-500">Solo archivos PDF</p>
            <input type="file" accept=".pdf" onChange={handleFile} hidden />
          </label>
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
          Crear cuenta empresarial
        </Button>
      </form>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)}>
        <CompanyTerms />
      </TermsModal>
    </AuthLayout>
  );
}
