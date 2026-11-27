import { useState } from "react";
import {
  Building2,
  Mail,
  User,
  Phone,
  MapPin,
  FileText,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { registerCompany } from "@/features/public/auth/api/authService";
import TermsModal from "@/features/public/auth/components/TermsModal";
import CompanyTerms from "@/features/public/auth/components/terms/CompanyTerms";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import { lastPublicPath } from "@/features/public/auth/authNavigation";
import PasswordInput from "@/features/public/auth/components/PasswordInput";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { Button, Input } from "@/shared/components/ui";
import { registerCompanySchema, useFormValidation } from "@/shared/validation";
import { FILE_ACCEPT, validateFile } from "@/shared/validation/files";

export default function CompanyForm() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [showTerms, setShowTerms] = useState(false);
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

  const { errors, errorFor, touch, validateAll } = useFormValidation(registerCompanySchema, form);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => touch(e.target.name);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, "pdf", "Certificado");
    if (error) {
      e.target.value = "";
      showAlert("error", error);
      return;
    }

    setCertificate(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) return;

    if (!certificate) {
      showAlert("error", "Debes adjuntar el certificado.");
      return;
    }

    try {
      setLoading(true);

      const res = await registerCompany({ ...form, certificate });

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


  return (
    <AuthLayout
      size="lg"
      icon={<Building2 size={28} />}
      backFallback={lastPublicPath()}
      title="Registrar empresa"
      subtitle="Crea tu cuenta empresarial para vender productos en RehniMarket."
      belowCard={
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="font-semibold brand-link">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-ink-muted">
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
              onBlur={handleBlur}
              error={errorFor("email")}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-ink-muted">
            Contraseña
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
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
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              // La no coincidencia se avisa mientras se escribe, como antes.
              error={
                errorFor("confirmPassword") ??
                (form.confirmPassword ? errors.confirmPassword : undefined)
              }
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-ink-muted">
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
              onBlur={handleBlur}
              error={errorFor("company_name")}
            />
            <Input
              label="Dirección"
              name="company_address"
              required
              leadingIcon={<MapPin size={18} />}
              placeholder="Dirección de la empresa"
              value={form.company_address}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errorFor("company_address")}
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
                onBlur={handleBlur}
                error={errorFor("company_nit")}
              />
              <Input
                label="DV"
                name="company_nit_dv"
                required
                placeholder="0"
                value={form.company_nit_dv}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errorFor("company_nit_dv")}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold text-ink-muted">
            Certificado de Cámara de Comercio
          </legend>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-white/15 p-6 text-center transition hover:border-secondary/60 hover:bg-secondary/5">
            <Upload size={26} className="text-secondary" />
            <p className="text-sm font-medium text-ink">
              {certificate ? certificate.name : "Seleccionar archivo PDF"}
            </p>
            <p className="text-xs text-ink-muted">Solo archivos PDF</p>
            <input type="file" accept={FILE_ACCEPT.pdf} onChange={handleFile} hidden />
          </label>
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
          Crear cuenta empresarial
        </Button>
      </form>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)}>
        <CompanyTerms />
      </TermsModal>
    </AuthLayout>
  );
}
