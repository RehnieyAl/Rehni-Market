import { useState } from "react";
import { Smartphone, X } from "lucide-react";

const DISMISS_KEY = "rm_mobile_notice_dismissed";

export default function MobileAppNotice() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      setDismissed(true);
      return;
    }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface-1/95 px-4 py-2.5 shadow-pop backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <Smartphone size={18} className="shrink-0 text-primary" />

        <p className="flex-1 text-xs leading-4 text-gray-600">
          Estás usando RehniMarket en el navegador. Funciona igual desde tu
          teléfono; la app para Android llegará pronto.
        </p>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="-mr-1 shrink-0 rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
