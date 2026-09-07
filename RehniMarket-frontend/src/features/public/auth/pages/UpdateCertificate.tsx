import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, FileUp, Lock, Mail, ShieldAlert } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { updateCompanyCertificate } from "@/features/public/auth/api/certificateService";

const MAX_SIZE = 5 * 1024 * 1024;

function fileError(file: File | null): string | null {
  if (!file) return null;
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "El certificado debe ser un archivo PDF.";
  if (file.size > MAX_SIZE) return "El certificado debe pesar como máximo 5 MB.";
  return null;
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
              : detail?.code === ErrorCode.INVALID_FILE
                ? "El certificado debe ser un archivo PDF de máximo 5 MB."
                : detail?.message ?? "No se pudo actualizar el certificado. Intenta de nuevo.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-dark flex min-h-dvh flex-col items-center justify-center bg-surface-0 px-4 py-10 text-ink">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-xl font-bold tracking-tight text-ink">
          RehniMarket
        </p>

        <div className="rounded-card border border-hairline bg-surface-1 p-6 shadow-pop sm:p-8">
          {done ? (
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-stock">
                <CheckCircle2 size={26} />
              </span>
              <h1 className="text-xl font-bold text-ink">Certificado actualizado</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Certificado actualizado correctamente. Tu empresa volverá a revisión y el
                equipo de RehniMarket lo evaluará de nuevo. Inicia sesión de nuevo cuando
                el certificado esté aprobado.
              </p>
              <Link
                to="/login"
                replace
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-control bg-primary px-5 text-sm font-medium text-primary-fg transition hover:bg-primary-hover"
              >
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/20 text-brand-300">
                <ShieldAlert size={22} />
              </span>

              <h1 className="text-xl font-bold text-ink sm:text-2xl">Actualizar certificado</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                El certificado que presentaste no es válido. Ingresa tus credenciales y
                carga uno nuevo para que tu empresa vuelva a revisión.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5" autoComplete="off">
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
                      className="h-11 w-full rounded-control border border-white/15 bg-surface-2 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-400 focus:ring-2 focus:ring-brand-600/30"
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
                      className="h-11 w-full rounded-control border border-white/15 bg-surface-2 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-400 focus:ring-2 focus:ring-brand-600/30"
                    />
                  </span>
                </label>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-ink">
                    Nuevo certificado
                  </span>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-white/15 bg-surface-2 p-5 text-center transition hover:border-brand-400/60">
                    <FileUp size={22} className="text-brand-300" />
                    <span className="text-sm font-medium text-ink">
                      {file ? file.name : "Seleccionar PDF"}
                    </span>
                    <span className="text-xs text-ink-muted">Máximo 5 MB · Solo PDF</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
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
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link to="/login" className="font-medium text-brand-300 hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
