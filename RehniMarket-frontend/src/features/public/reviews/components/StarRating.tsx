import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export default function StarRating({ value, onChange, size = 18 }: StarRatingProps) {
  const interactive = !!onChange;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          aria-label={`${star} estrella${star === 1 ? "" : "s"}`}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={size}
            className={star <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}
