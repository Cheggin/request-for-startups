"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RatingInput from "@/components/surveys/rating-input";

const SURVEY_TITLE = "Weekly Pulse — Week 14";

const QUESTIONS = [
  { id: "q1", type: "rating" as const, text: "How would you rate your overall satisfaction this week?" },
  { id: "q2", type: "rating" as const, text: "How supported do you feel by your team?" },
  { id: "q3", type: "rating" as const, text: "How manageable is your current workload?" },
  { id: "q4", type: "text" as const, text: "What's one thing we could improve?" },
  { id: "q5", type: "text" as const, text: "Any wins or shoutouts from this week?" },
] as const;

type Answers = Record<string, number | string | null>;

export default function RespondPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);

  function setAnswer(id: string, value: number | string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate async submit
    await new Promise((resolve) => setTimeout(resolve, 600));
    router.push(`/respond/${token}/thanks`);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border px-5 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#6d28d9" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.8" />
              <circle cx="7" cy="7" r="2" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground">PulseCheck</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8">
        {/* Survey title */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground">{SURVEY_TITLE}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All responses are anonymous. This takes about 2 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {QUESTIONS.map((question, idx) => (
              <div key={question.id} className="card">
                <p className="text-sm font-medium text-foreground mb-4">
                  <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                  {question.text}
                </p>

                {question.type === "rating" ? (
                  <RatingInput
                    value={(answers[question.id] as number) ?? null}
                    onChange={(val) => setAnswer(question.id, val)}
                  />
                ) : (
                  <textarea
                    value={(answers[question.id] as string) ?? ""}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    placeholder="Your answer..."
                    rows={3}
                    className="input-field resize-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
              style={{ padding: "12px 20px", fontSize: "15px" }}
            >
              {submitting ? "Submitting..." : "Submit Response"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
