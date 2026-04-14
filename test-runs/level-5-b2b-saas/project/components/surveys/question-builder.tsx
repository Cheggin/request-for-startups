"use client";

const TYPE_OPTIONS = [
  { value: "rating", label: "Rating (1-5)" },
  { value: "text", label: "Open Text" },
] as const;

type QuestionType = "rating" | "text";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  order: number;
}

interface QuestionBuilderProps {
  question: Question;
  onUpdate: (updated: Question) => void;
  onDelete: (id: string) => void;
}

function GripIcon() {
  return (
    <div className="flex flex-col gap-[3px] px-1">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-[3px]">
          {[0, 1].map((col) => (
            <div
              key={col}
              className="w-[3px] h-[3px] rounded-full bg-muted-foreground/40"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function QuestionBuilder({
  question,
  onUpdate,
  onDelete,
}: QuestionBuilderProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-accent/30 transition-colors">
      {/* Drag handle */}
      <div className="cursor-grab shrink-0" title="Drag to reorder">
        <GripIcon />
      </div>

      {/* Question text input */}
      <input
        type="text"
        value={question.text}
        onChange={(e) => onUpdate({ ...question, text: e.target.value })}
        placeholder="Enter question text..."
        className="input-field flex-1 min-w-0"
      />

      {/* Type toggle */}
      <div className="flex shrink-0 rounded-lg border border-border overflow-hidden">
        {TYPE_OPTIONS.map((option) => {
          const isActive = question.type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate({ ...question, type: option.value })}
              className={[
                "px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
              style={isActive ? { backgroundColor: "#6d28d9" } : undefined}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(question.id)}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-danger hover:bg-red-50 transition-colors"
        aria-label="Delete question"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path
            d="M5.5 1a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4ZM3 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1H11v7.5A1.5 1.5 0 0 1 9.5 13h-4A1.5 1.5 0 0 1 4 11.5V4h-.5a.5.5 0 0 1-.5-.5ZM5 4v7.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5V4H5Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
