import { X, ExternalLink } from "lucide-react";

interface CertificateModalProps {
  certificateUrl: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CertificateModal({
  certificateUrl,
  companyName,
  isOpen,
  onClose,
}: CertificateModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-card bg-surface-1 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Certificado empresarial
            </h2>

            <p className="text-sm text-gray-500">
              {companyName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              <ExternalLink size={18} />
              Abrir
            </a>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100"
              title="Cerrar"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-gray-100">
          <iframe
            src={certificateUrl}
            title={`Certificado de ${companyName}`}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}