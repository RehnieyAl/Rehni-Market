/** Verificación del correo de un registro (comprador o empresa): código de 6 dígitos, cambio de correo
 * y reenvío con el cooldown del backend. El correo del proceso sobrevive a una recarga. */
import { useEffect, useState } from "react";
import { AlertCircle, Mail, MailCheck, Timer } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  verifyEmail,
  changeEmail,
  resendVerificationCode,
} from "@/features/public/auth/api/authService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import OtpInput from "@/features/public/auth/components/OtpInput";
import ResendCode from "@/features/public/auth/components/ResendCode";
import { formatCountdown } from "@/features/public/auth/utils/countdown";
import { Button, Input } from "@/shared/components/ui";

const EMAIL_KEY = "verifyEmail.email";

function rememberedEmail(): string {
  try {
    return sessionStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberEmail(email: string) {
  try {
    sessionStorage.setItem(EMAIL_KEY, email);
  } catch {
    // Sin sessionStorage (modo privado estricto) solo se pierde el correo al recargar.
  }
}

function toDeadline(seconds: number | undefined | null): number | null {
  return typeof seconds === "number" && Number.isFinite(seconds)
    ? Date.now() + seconds * 1000
    : null;
}

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const navState = (location.state ?? {}) as {
    email?: string;
    expiresIn?: number;
    resendAvailableIn?: number;
  };

  const email = navState.email ?? rememberedEmail();

  const [currentEmail, setCurrentEmail] = useState(email);
  const [newEmail, setNewEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [focusKey, setFocusKey] = useState(0);

  const [codeDeadline, setCodeDeadline] = useState<number | null>(() =>
    toDeadline(navState.expiresIn),
  );

  const [resendAvailableIn, setResendAvailableIn] = useState(navState.resendAvailableIn);
  const [resendKey, setResendKey] = useState(0);

  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (currentEmail) rememberEmail(currentEmail);
  }, [currentEmail]);

  const codeSecondsLeft =
    codeDeadline === null
      ? null
      : Math.max(0, Math.ceil((codeDeadline - nowTs) / 1000));

  const codeExpired = codeSecondsLeft === 0;

  const applyCodeState = (state: {
    expires_in?: number;
    resend_available_in?: number;
  }) => {
    setCodeDeadline(toDeadline(state.expires_in));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (codeExpired) {
      showAlert("error", "El código expiró. Solicita uno nuevo para continuar.");
      return;
    }

    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      showAlert("error", "Ingresa el código completo.");
      return;
    }

    setLoading(true);

    try {
      await verifyEmail({
        email: currentEmail,
        code: verificationCode,
      });

      showAlert("success", "Cuenta verificada correctamente.");

      void navigate("/login", {
        state: {
          email: currentEmail,
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err.response?.data?.detail;

        if (error?.code === ErrorCode.CODE_EXPIRED) {
          setCodeDeadline(Date.now());
        }

        switch (error?.code) {
          case ErrorCode.USER_NOT_FOUND:
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

  const handleResent = (state: { expires_in?: number }) => {
    applyCodeState(state);
    setCode(["", "", "", "", "", ""]);
    setFocusKey((key) => key + 1);
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      showAlert("error", "Ingresa un correo electrónico.");
      return;
    }

    setChangingEmail(true);

    try {
      const res = await changeEmail({
        old_email: currentEmail,
        new_email: newEmail,
      });

      setCurrentEmail(newEmail);
      setNewEmail("");
      setEditingEmail(false);
      setCode(["", "", "", "", "", ""]);
      setFocusKey((key) => key + 1);

      applyCodeState(res ?? {});
      setResendAvailableIn(res?.resend_available_in);
      setResendKey((key) => key + 1);

      showAlert(
        "success",
        "Correo actualizado correctamente. Se ha enviado un nuevo código de verificación.",
      );
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail?.message : undefined;
      showAlert("error", message ?? "No fue posible cambiar el correo.");
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <AuthLayout
      icon={<MailCheck size={28} />}
      backFallback="/login"
      title="Verifica tu correo"
      subtitle={
        <>
          Enviamos un código de 6 dígitos a{" "}
          <span className="font-medium text-ink break-all">{currentEmail}</span>
        </>
      }
      belowCard={
        <p>
          ¿Ya verificaste tu cuenta?{" "}
          <Link
            to="/login"
            state={{ email: currentEmail }}
            className="font-semibold brand-link"
          >
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <div className="mb-6">
        {!editingEmail ? (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setEditingEmail(true)}
              className="text-sm font-medium brand-link"
            >
              ¿El correo es incorrecto? Cambiarlo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Nuevo correo electrónico"
              leadingIcon={<Mail size={18} />}
            />
            <div className="flex gap-3">
              <Button
                fullWidth
                loading={changingEmail}
                onClick={handleChangeEmail}
              >
                Guardar
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setEditingEmail(false);
                  setNewEmail("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <OtpInput
          value={code}
          onChange={setCode}
          disabled={codeExpired}
          autoFocusKey={focusKey}
          ariaLabel="Código de verificación"
        />

        {codeExpired ? (
          <div className="flex items-start gap-2.5 rounded-control border border-danger/30 bg-danger-bg p-3 text-sm text-danger">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">El código expiró</p>
              <p className="mt-0.5 text-danger/90">Solicita uno nuevo para continuar.</p>
            </div>
          </div>
        ) : (
          codeSecondsLeft !== null && (
            <p className="flex items-center justify-center gap-2 text-sm text-ink-muted">
              <Timer size={15} />
              Código válido durante{" "}
              <span className="font-semibold tabular-nums text-ink">
                {formatCountdown(codeSecondsLeft)}
              </span>
            </p>
          )
        )}

        <ResendCode
          key={resendKey}
          email={currentEmail}
          availableIn={resendAvailableIn}
          disabled={changingEmail}
          onResend={() => resendVerificationCode({ email: currentEmail })}
          onResent={handleResent}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          disabled={codeExpired}
        >
          Verificar correo
        </Button>
      </form>

    </AuthLayout>
  );
}
