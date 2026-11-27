/** Actualización pública del certificado de una empresa con NEEDS_UPDATE o REJECTED (correo + contraseña, sin JWT). */
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, FileUp, Lock, Mail, ShieldAlert } from "lucide-react";

import { Button } from "@/shared/components/ui";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { updateCompanyCertificate } from "@/features/public/auth/api/certificateService";
import { FILE_ACCEPT, validateFile } from "@/shared/validation/files";

function fileError(file: File | null): string | null {
  return file ? validateFile(file, "pdf", "Certificado") : null;
}

export default function UpdateCertificate() {
  const { logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const localFileError = fileError(file);
  const canSubmit =
    email.trim() !== "" && password !== "" && file !== null && !localFileError && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      await updateCompanyCertificate({ email: email.trim(), password, certificate: file });
      // El certificado ya volvió a PENDING en el backend. Esta operación no usa
      // JWT, pero por si existiera una sesión previa se limpia por completo
      // (accessToken, refreshToken, role + estado de AuthProvider) para que la
      // empresa vuelva al login sin sesión autenticada.
      logout();
      setDone(true);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;

      const message =
        detail?.code === ErrorCode.INVALID_CREDENTIALS
          ? "Correo o contraseña incorrectos."
          : detail?.code === ErrorCode.COMPANY_APPROVED ||
              detail?.code === ErrorCode.COMPANY_PENDING
            ? "El certificado de esta empresa no puede actualizarse en este momento."
            : detail?.code === ErrorCode.COMPANY_SUSPENDED
              ? "Tu empresa se encuentra suspendida."
              : detail?.message ?? "No se pudo actualizar el certificado. Intenta de nuevo.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={done ? <CheckCircle2 size={28} /> : <ShieldAlert size={28} />}
      title={done ? "Certificado actualizado" : "Actualizar certificado"}
      subtitle={
        done
          ? "Tu empresa volverá a revisión y el equipo de RehniMarket evaluará el nuevo certificado. Inicia sesión cuando esté aprobado."
          : "El certificado que presentaste no es válido. Ingresa tus credenciales y carga uno nuevo para que tu empresa vuelva a revisión."
      }
      backFallback="/login"
    >
      {done ? (
      <Link
        to="/login"
        replace
        className="inline-flex h-11 w-full items-center justify-center rounded-control bg-primary px-5 text-sm font-medium text-primary-fg transition fill-hover"
      >
        Ir al inicio de sesión
      </Link>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Correo electrónico
          </span>
          <span className="relative block">
            <Mail
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="empresa@correo.com"
              className="h-11 w-full rounded-control border border-white/15 bg-surface-2 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-secondary focus:ring-2 focus:ring-secondary/30"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Contraseña</span>
          <span className="relative block">
            <Lock
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-control border border-white/15 bg-surface-2 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-secondary focus:ring-2 focus:ring-secondary/30"
            />
          </span>
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Nuevo certificado
          </span>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-white/15 bg-surface-2 p-5 text-center transition hover:border-secondary/60">
            <FileUp size={22} className="text-secondary" />
            <span className="text-sm font-medium text-ink">
              {file ? file.name : "Seleccionar PDF"}
            </span>
            <span className="text-xs text-ink-muted">Máximo 5 MB · Solo PDF</span>
            <input
              type="file"
              accept={FILE_ACCEPT.pdf}
              hidden
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError(null);
              }}
            />
          </label>
          {localFileError && (
            <p className="mt-1.5 text-xs font-medium text-danger">{localFileError}</p>
          )}
        </div>

        {error && (
          <p className="rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" loading={loading} disabled={!canSubmit}>
          {loading ? "Actualizando…" : "Actualizar certificado"}
        </Button>
      </form>
      )}
    </AuthLayout>
  );
}
