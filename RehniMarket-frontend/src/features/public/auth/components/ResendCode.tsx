/** "Reenviar código  00:45": reenvío con el cooldown que dicta el backend (contador informativo, 429 con
 * retry_after), sin doble envío y con el resultado anunciado a lectores de pantalla. */
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Clock, RefreshCw } from "lucide-react";

import { cn } from "@/shared/utils/cn";

import type { VerificationCodeState } from "../types/response";
import { formatCountdown } from "../utils/countdown";

interface ResendCodeProps {
  email: string;
  /** Segundos que faltan para poder reenviar, tal como los devolvió el servidor. */
  availableIn?: number;
  onResend: () => Promise<VerificationCodeState & { message?: string }>;
  onResent?: (state: VerificationCodeState) => void;
  disabled?: boolean;
}

type Feedback = { tone: "success" | "error"; text: string } | null;

function deadlineFrom(seconds: number | undefined): number {
  return typeof seconds === "number" && seconds > 0 ? Date.now() + seconds * 1000 : 0;
}

function retryAfterOf(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const fromBody = error.response?.data?.detail?.retry_after;
  if (typeof fromBody === "number") return fromBody;
  const fromHeader = Number(error.response?.headers?.["retry-after"]);
  return Number.isFinite(fromHeader) && fromHeader > 0 ? fromHeader : undefined;
}

export default function ResendCode({ email, availableIn, onResend, onResent, disabled = false }: ResendCodeProps) {
  const [deadline, setDeadline] = useState(() => deadlineFrom(availableIn));
  const [now, setNow] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (deadline <= now) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadline, now]);

  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
  const blocked = disabled || sending || secondsLeft > 0 || !email;

  const handleClick = async () => {
    if (blocked || inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setFeedback(null);

    try {
      const state = await onResend();
      setDeadline(deadlineFrom(state.resend_available_in));
      setNow(Date.now());
      setFeedback({ tone: "success", text: "Código reenviado. Revisa tu correo." });
      onResent?.(state);
    } catch (error) {
      const retryAfter = retryAfterOf(error);
      if (retryAfter) {
        setDeadline(deadlineFrom(retryAfter));
        setNow(Date.now());
      }
      const message = axios.isAxiosError(error) ? error.response?.data?.detail?.message : undefined;
      setFeedback({ tone: "error", text: message ?? "No fue posible reenviar el código. Intenta de nuevo." });
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={blocked}
          aria-busy={sending || undefined}
          aria-describedby={secondsLeft > 0 ? "resend-countdown" : undefined}
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-secondary/15 px-4 text-sm font-medium text-ink transition hover:bg-secondary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} aria-hidden="true" className={cn("text-secondary", sending && "motion-safe:animate-spin")} />
          Reenviar código
        </button>

        {secondsLeft > 0 && (
          <span id="resend-countdown" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Clock size={16} aria-hidden="true" className="text-ink-muted" />
            <span className="sr-only">Podrás reenviarlo en</span>
            <span className="tabular-nums">{formatCountdown(secondsLeft)}</span>
          </span>
        )}
      </div>

      <p
        role={feedback?.tone === "error" ? "alert" : "status"}
        aria-live="polite"
        className={cn(
          "mt-2 text-sm empty:hidden",
          feedback?.tone === "error" ? "text-danger" : "text-ink-muted",
        )}
      >
        {feedback?.text}
      </p>
    </div>
  );
}
