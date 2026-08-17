import { useState } from "react";
import axios from "axios";

import StarRating from "./StarRating";
import { createReview } from "../api/reviewService";
import { useAlert } from "@/shared/components/alert/useAlert";

interface ReviewFormProps {
  productId: string;
  onCreated: () => void;
}

// Formulario "Escribir reseña" - solo se monta cuando el backend ya
// confirmó elegibilidad (ver ReviewsSection.tsx > ReviewEligibility), no
// reimplementa esa validación acá.
export default function ReviewForm({ productId, onCreated }: ReviewFormProps) {
  const { showAlert } = useAlert();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showAlert("error", "Selecciona una calificación antes de enviar tu reseña.");
      return;
    }

    try {
      setSubmitting(true);

      await createReview(productId, rating, comment.trim() || undefined);

      setRating(0);
      setComment("");
      showAlert("success", "¡Gracias por tu reseña!");
      onCreated();
    } catch (error) {
      console.error("Error creando la reseña:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo enviar tu reseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="mb-2 text-sm font-medium text-gray-900">Escribe tu reseña</p>

      <StarRating value={rating} onChange={setRating} size={24} />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntale a otros compradores qué te pareció (opcional)"
        maxLength={1000}
        rows={3}
        className="mt-3 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#6D0F2D]"
      />

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-3 rounded-xl bg-[#6D0F2D] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#530A20] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Enviando..." : "Enviar reseña"}
      </button>
    </div>
  );
}
