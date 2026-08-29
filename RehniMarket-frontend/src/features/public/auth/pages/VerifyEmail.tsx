import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  verifyEmail,
  changeEmail,
  resendVerificationCode,
} from "@/features/public/auth/api/authService";

import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import axios from "axios";

// mm:ss a partir de una cantidad de segundos (>= 0).
function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// segundos -> timestamp absoluto (ms). Trabajar con un "momento objetivo"
// y no con un contador decreciente en estado evita que el tiempo se
// "congele" si la pestaña queda en segundo plano.
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

  // CONTADOR 1: expiración del código (5 min). null = no sabemos el estado
  // todavía (p. ej. se llegó a esta pantalla sin pasar por login/registro)
  // -> se muestra sin contador y con el reenvío disponible.
  const [codeDeadline, setCodeDeadline] = useState<number | null>(() =>
    toDeadline(navState.expiresIn),
  );

  // CONTADOR 2: cooldown de reenvío (60 s). Siempre hay uno; si no vino
  // nada, arranca ya disponible.
  const [resendDeadline, setResendDeadline] = useState<number>(() =>
    toDeadline(navState.resendAvailableIn) ?? Date.now(),
  );

  // Tick de 1 s solo para re-renderizar los contadores.
  const [nowTs, setNowTs] = useState(() => Date.now());

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const codeSecondsLeft =
    codeDeadline === null
      ? null
      : Math.max(0, Math.ceil((codeDeadline - nowTs) / 1000));

  const resendSecondsLeft = Math.max(
    0,
    Math.ceil((resendDeadline - nowTs) / 1000),
  );

  const codeExpired = codeSecondsLeft === 0;
  const canResend = resendSecondsLeft === 0 && !resending && !changingEmail;

  const applyCodeState = (state: {
    expires_in?: number;
    resend_available_in?: number;
  }) => {
    setCodeDeadline(toDeadline(state.expires_in));
    setResendDeadline(toDeadline(state.resend_available_in) ?? Date.now());
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;

    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
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

        // El backend es la única fuente de verdad de la expiración: si
        // dice que expiró, se refleja aunque el contador local aún no
        // hubiera llegado a 0.
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
      inputs.current[0]?.focus();

      showAlert(
        "success",
        res.message ?? "Se ha enviado un nuevo código a tu correo electrónico.",
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        // El backend manda el cooldown real -> sincronizamos el contador
        // con `retry_after` (el mensaje ya lo muestra la alerta global).
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#6D0F2D]/10 flex items-center justify-center">
              <Mail size={30} className="text-[#6D0F2D]" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center">Verifica tu correo</h1>

          <p className="text-center text-gray-500 mt-3">
            Hemos enviado un código de verificación a
          </p>

          <p className="text-center font-semibold text-[#6D0F2D] mt-2 break-all">
            {currentEmail}
          </p>

          <div className="mt-5">
            {!editingEmail ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  className="text-sm font-semibold text-[#6D0F2D] hover:underline"
                >
                  ¿El correo es incorrecto? Cambiar correo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Nuevo correo electrónico"
                  className="w-full h-12 rounded-xl border border-gray-300 px-4 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={changingEmail}
                    onClick={handleChangeEmail}
                    className="flex-1 h-11 rounded-xl bg-[#6D0F2D] text-white font-semibold hover:bg-[#530A20] transition"
                  >
                    {changingEmail ? "Actualizando..." : "Guardar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmail(false);
                      setNewEmail("");
                    }}
                    className="flex-1 h-11 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputs.current[index] = el;
                  }}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={codeExpired}
                  maxLength={1}
                  inputMode="numeric"
                  className="w-12 h-14 rounded-2xl border border-gray-300 text-center text-xl font-bold outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10 disabled:bg-gray-100 disabled:text-gray-400"
                />
              ))}
            </div>

            {/* CONTADOR 1 - expiración del código */}
            {codeSecondsLeft !== null && !codeExpired && (
              <p className="mt-5 text-center text-gray-500">
                Código válido durante{" "}
                <span className="font-semibold text-gray-800 tabular-nums">
                  {formatCountdown(codeSecondsLeft)}
                </span>
              </p>
            )}

            {codeExpired && (
              <div className="mt-5 rounded-xl bg-red-50 border border-red-200 p-4 text-center">
                <p className="font-semibold text-red-700">Código expirado.</p>
                <p className="text-sm text-red-600 mt-1">
                  Solicita un nuevo código para continuar.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || codeExpired}
              className="mt-6 w-full h-14 rounded-2xl bg-[#6D0F2D] text-white font-semibold hover:bg-[#530A20] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Verificando..." : "Verificar correo"}
            </button>
          </form>

          {/* CONTADOR 2 - cooldown de reenvío (separado del contador 1) */}
          <div className="mt-8 border-t border-gray-100 pt-6 text-center">
            <p className="text-gray-500">¿No recibiste el código?</p>

            {!canResend && resendSecondsLeft > 0 ? (
              <p className="mt-2 text-gray-500">
                Puedes reenviar en{" "}
                <span className="font-semibold text-gray-800 tabular-nums">
                  {formatCountdown(resendSecondsLeft)}
                </span>
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className="mt-3 h-11 w-full rounded-xl border border-[#6D0F2D] font-semibold text-[#6D0F2D] transition hover:bg-[#6D0F2D]/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? "Enviando..." : "Reenviar código"}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500">¿Ya verificaste tu cuenta?</p>

            <Link
              to="/login"
              state={{ email: currentEmail }}
              className="font-semibold text-[#6D0F2D] hover:underline"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
