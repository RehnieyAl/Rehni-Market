import { useEffect, useState } from "react";
import { Mail, Timer, RefreshCw, AlertCircle } from "lucide-react";
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
import { Button, Input } from "@/shared/components/ui";

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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

  const email = navState.email ?? "";

  const [currentEmail, setCurrentEmail] = useState(email);
  const [newEmail, setNewEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [resending, setResending] = useState(false);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [focusKey, setFocusKey] = useState(0);

  const [codeDeadline, setCodeDeadline] = useState<number | null>(() =>
    toDeadline(navState.expiresIn),
  );

  const [resendDeadline, setResendDeadline] = useState<number>(() =>
    toDeadline(navState.resendAvailableIn) ?? Date.now(),
  );

  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const codeSecondsLeft =
    codeDeadline === null
      ? null
      : Math.max(0, Math.ceil((codeDeadline - nowTs) / 1000));

  const resendSecondsLeft = Math.max(0, Math.ceil((resendDeadline - nowTs) / 1000));

  const codeExpired = codeSecondsLeft === 0;
  const canResend = resendSecondsLeft === 0 && !resending && !changingEmail;

  const applyCodeState = (state: {
    expires_in?: number;
    resend_available_in?: number;
  }) => {
    setCodeDeadline(toDeadline(state.expires_in));
    setResendDeadline(toDeadline(state.resend_available_in) ?? Date.now());
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

      navigate("/login", {
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

  const handleResend = async () => {
    if (!canResend) return;

    setResending(true);

    try {
      const res = await resendVerificationCode({ email: currentEmail });

      applyCodeState(res);
      setCode(["", "", "", "", "", ""]);
      setFocusKey((key) => key + 1);

      showAlert(
        "success",
        res.message ?? "Se ha enviado un nuevo código a tu correo electrónico.",
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        if (
          detail?.code === ErrorCode.RESEND_COOLDOWN_ACTIVE &&
          typeof detail.retry_after === "number"
        ) {
          setResendDeadline(Date.now() + detail.retry_after * 1000);
        }
      } else {
        showAlert("error", "No fue posible reenviar el código.");
      }
    } finally {
      setResending(false);
    }
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

      showAlert(
        "success",
        "Correo actualizado correctamente. Se ha enviado un nuevo código de verificación.",
      );
    } catch (error) {
      console.error(error);
      showAlert("error", "No fue posible cambiar el correo.");
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <AuthLayout
      icon={<Mail size={24} />}
      title="Verifica tu correo"
      subtitle={
        <>
          Enviamos un código de 6 dígitos a{" "}
          <span className="font-medium text-gray-700 break-all">{currentEmail}</span>
        </>
      }
      belowCard={
        <p>
          ¿Ya verificaste tu cuenta?{" "}
          <Link
            to="/login"
            state={{ email: currentEmail }}
            className="font-semibold text-primary hover:underline"
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
              className="text-sm font-medium text-primary hover:underline"
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
            <p className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Timer size={15} />
              Código válido durante{" "}
              <span className="font-semibold tabular-nums text-gray-800">
                {formatCountdown(codeSecondsLeft)}
              </span>
            </p>
          )
        )}

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

      <div className="mt-6 border-t border-gray-100 pt-5 text-center">
        <p className="text-sm text-gray-500">¿No recibiste el código?</p>

        {!canResend && resendSecondsLeft > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            Podrás reenviar en{" "}
            <span className="font-semibold tabular-nums text-gray-800">
              {formatCountdown(resendSecondsLeft)}
            </span>
          </p>
        )}

        <Button
          variant="outline"
          fullWidth
          className="mt-3"
          leadingIcon={<RefreshCw size={16} />}
          onClick={handleResend}
          loading={resending}
          disabled={!canResend}
        >
          Reenviar código
        </Button>
      </div>
    </AuthLayout>
  );
}
