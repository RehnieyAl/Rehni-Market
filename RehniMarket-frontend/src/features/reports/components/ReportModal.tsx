import { AlertTriangle, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createReport } from "../api/reportService";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { ReportTargetType } from "../types/response";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
}

const REASON_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 1000;

const MAX_EVIDENCE_IMAGES = 5;
const MAX_EVIDENCE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface EvidencePreview {
  file: File;
  previewUrl: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: ReportModalProps) {
  const { showAlert } = useAlert();

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidences, setEvidences] = useState<EvidencePreview[]>([]);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      evidences.forEach((evidence) => URL.revokeObjectURL(evidence.previewUrl));
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  const reasonMissing = reason.trim().length === 0;

  const resetForm = () => {
    evidences.forEach((evidence) => URL.revokeObjectURL(evidence.previewUrl));
    setReason("");
    setDescription("");
    setEvidences([]);
    setEvidenceError(null);
  };

  const handleClose = () => {
    if (submitting) return;

    onClose();
    resetForm();
  };

  const handleAddEvidences = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setEvidenceError(null);

    const incoming = Array.from(files);
    const accepted: EvidencePreview[] = [];

    for (const file of incoming) {
      if (evidences.length + accepted.length >= MAX_EVIDENCE_IMAGES) {
        setEvidenceError(
          `Puedes adjuntar como máximo ${MAX_EVIDENCE_IMAGES} imágenes.`,
        );
        break;
      }

      if (!ALLOWED_EVIDENCE_TYPES.includes(file.type)) {
        setEvidenceError("Solo se permiten imágenes JPEG, PNG o WEBP.");
        continue;
      }

      if (file.size > MAX_EVIDENCE_FILE_SIZE_BYTES) {
        setEvidenceError("Cada imagen debe pesar como máximo 5 MB.");
        continue;
      }

      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    if (accepted.length > 0) {
      setEvidences((prev) => [...prev, ...accepted]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidences((prev) => {
      const target = prev[index];

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((_, i) => i !== index);
    });

    setEvidenceError(null);
  };

  const handleSubmit = async () => {
    if (reasonMissing) return;

    try {
      setSubmitting(true);

      await createReport(
        targetType,
        targetId,
        reason.trim(),
        description.trim() || undefined,
        evidences.map((evidence) => evidence.file),
      );

      showAlert(
        "success",
        targetType === "product"
          ? "Reporte enviado. Un administrador revisará este producto."
          : "Reporte enviado. Un administrador revisará esta empresa.",
      );

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error enviando el reporte:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const targetTypeLabel = targetType === "product" ? "producto" : "empresa";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle size={21} className="text-amber-600" />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                Reportar {targetTypeLabel}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-5 text-sm leading-6 text-gray-600">
          Vas a reportar{" "}
          <span className="font-semibold text-gray-900">{targetLabel}</span>.
          Un administrador revisará tu reporte antes de tomar cualquier
          acción.
        </p>

        <div className="mt-4">
          <label
            htmlFor="report-reason"
            className="block text-sm font-medium text-gray-700"
          >
            Motivo <span className="text-red-600">*</span>
          </label>

          <input
            id="report-reason"
            type="text"
            value={reason}
            onChange={(event) =>
              setReason(event.target.value.slice(0, REASON_MAX_LENGTH))
            }
            disabled={submitting}
            required
            placeholder={
              targetType === "product"
                ? "Ej: Producto falso o no corresponde a la descripción."
                : "Ej: Incumplimiento de las políticas de la plataforma."
            }
            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
              reasonMissing
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-brand-600 focus:ring-brand-600/20"
            }`}
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="report-description"
            className="block text-sm font-medium text-gray-700"
          >
            Descripción (opcional)
          </label>

          <textarea
            id="report-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value.slice(0, DESCRIPTION_MAX_LENGTH),
              )
            }
            disabled={submitting}
            rows={3}
            placeholder="Cuéntanos más detalles sobre el problema."
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Evidencias (opcional)
          </label>

          <p className="mt-1 text-xs text-gray-500">
            Puedes adjuntar hasta {MAX_EVIDENCE_IMAGES} imágenes como
            evidencia (JPEG, PNG o WEBP, máx. 5 MB c/u).
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(event) => handleAddEvidences(event.target.files)}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting || evidences.length >= MAX_EVIDENCE_IMAGES}
            className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-brand-600 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus size={16} />
            Añadir imágenes
          </button>

          {evidenceError && (
            <p className="mt-2 text-xs text-red-600">{evidenceError}</p>
          )}

          {evidences.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {evidences.map((evidence, index) => (
                <div
                  key={evidence.previewUrl}
                  className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200"
                >
                  <img
                    src={evidence.previewUrl}
                    alt={`Evidencia ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveEvidence(index)}
                    disabled={submitting}
                    title="Quitar imagen"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || reasonMissing}
            title={reasonMissing ? "Debes indicar un motivo" : undefined}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar reporte"}
          </button>
        </div>
      </div>
    </div>
  );
}
