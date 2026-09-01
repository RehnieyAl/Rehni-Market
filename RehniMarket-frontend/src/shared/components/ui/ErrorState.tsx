import { AlertTriangle } from "lucide-react";

import Button from "./Button";
import EmptyState from "./EmptyState";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "card" | "plain";
  className?: string;
}

export default function ErrorState({
  title = "No pudimos cargar esta información",
  description = "Ocurrió un problema al obtener los datos. Intenta de nuevo.",
  onRetry,
  retryLabel = "Reintentar",
  variant = "card",
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={<AlertTriangle size={22} />}
      title={title}
      description={description}
      variant={variant}
      className={className}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    />
  );
}
