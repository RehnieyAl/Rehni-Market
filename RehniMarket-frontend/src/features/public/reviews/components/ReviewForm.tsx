import { useState } from "react";
import axios from "axios";

import StarRating from "./StarRating";
import { createReview } from "../api/reviewService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Button, Textarea } from "@/shared/components/ui";

interface ReviewFormProps {
  productId: string;
  onCreated: () => void;
}

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
    <div className="rounded-card border border-gray-200 bg-surface-1 p-4 dark:border-hairline dark:bg-surface-1">
      <p className="mb-2 text-sm font-medium text-gray-900 dark:text-ink">Escribe tu reseña</p>

      <StarRating value={rating} onChange={setRating} size={24} />

      <Textarea
        className="mt-3"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntale a otros compradores qué te pareció (opcional)"
        maxLength={1000}
        rows={3}
      />

      <Button className="mt-3" size="sm" loading={submitting} onClick={handleSubmit}>
        {submitting ? "Enviando…" : "Enviar reseña"}
      </Button>
    </div>
  );
}
