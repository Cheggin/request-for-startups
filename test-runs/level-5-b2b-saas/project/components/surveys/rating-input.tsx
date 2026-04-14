"use client";

const RATINGS = [1, 2, 3, 4, 5] as const;

interface RatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div className="flex gap-2">
      {RATINGS.map((rating) => {
        const isSelected = value === rating;
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={[
              "w-11 h-11 rounded-lg text-sm font-semibold transition-colors",
              isSelected
                ? "text-white border-2 border-transparent"
                : "border-2 border-border text-foreground hover:border-accent hover:text-accent bg-transparent",
            ].join(" ")}
            style={isSelected ? { backgroundColor: "#6d28d9", borderColor: "#6d28d9" } : undefined}
            aria-pressed={isSelected}
          >
            {rating}
          </button>
        );
      })}
    </div>
  );
}
