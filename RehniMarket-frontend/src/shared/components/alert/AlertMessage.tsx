
import {
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface AlertMessageProps {
  type: "error" | "success";
  message: string;
  onClose?: () => void;
}

export default function AlertMessage({
  type,
  message,
  onClose,
}: AlertMessageProps) {
  return (
    <div
      className={`
        fixed
        left-1/2
        top-6
        z-[9999]
        flex
        w-[90%]
        max-w-md
        -translate-x-1/2
        items-center
        justify-between
        gap-4
        rounded-2xl
        border
        px-5
        py-4
        shadow-lg
        ${
          type === "error"
            ? "border-red-200 bg-[#F9EEF2] text-[#6D0F2D]"
            : "border-green-200 bg-green-50 text-green-700"
        }
      `}
    >
      {type === "error" ? (
        <AlertCircle
          size={21}
          className="shrink-0"
        />
      ) : (
        <CheckCircle
          size={21}
          className="shrink-0"
        />
      )}

      <p className="flex-1 font-medium">
        {message}
      </p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 hover:opacity-70"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

