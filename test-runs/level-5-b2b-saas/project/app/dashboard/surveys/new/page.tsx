"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SURVEY_TEMPLATES } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";
import type { Question } from "@/lib/mock-data";

const RECIPIENT_COUNT = 7;

type DraftQuestion = Omit<Question, "id"> & { id: string };

export default function NewSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  function applyTemplate(templateName: string) {
    const template = SURVEY_TEMPLATES.find((t) => t.name === templateName);
    if (!template) return;
    setSelectedTemplate(templateName);
    if (!title) setTitle(templateName);
    setQuestions(
      template.questions.map((q) => ({
        id: generateId(),
        type: q.type,
        text: q.text,
        order: q.order,
      }))
    );
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateId(),
        type: "rating",
        text: "",
        order: prev.length,
      },
    ]);
  }

  function updateQuestion(id: string, patch: Partial<DraftQuestion>) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q))
    );
  }

  function deleteQuestion(id: string) {
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, idx) => ({ ...q, order: idx }))
    );
  }

  function handleSaveDraft() {
    router.push("/dashboard/surveys");
  }

  function handleSend() {
    setShowConfirm(true);
  }

  function confirmSend() {
    setShowConfirm(false);
    router.push("/dashboard/surveys");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto pb-28">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">New Survey</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Build a custom survey or start from a template
        </p>
      </div>

      {/* Title */}
      <div className="card mb-5">
        <label className="block text-sm font-medium text-foreground mb-2">
          Survey Title
        </label>
        <input
          className="input-field"
          placeholder="e.g. Weekly Pulse — Week 15"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Templates */}
      <div className="card mb-5">
        <p className="text-sm font-medium text-foreground mb-3">
          Start from a Template
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SURVEY_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.name;
            return (
              <button
                key={template.name}
                onClick={() => applyTemplate(template.name)}
                className={[
                  "text-left p-4 rounded-lg border transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-foreground mb-1">
                  {template.name}
                </p>
                <p className="text-xs text-muted-foreground leading-snug">
                  {template.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {template.questions.length} questions
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-foreground">Questions</p>
          <span className="text-xs text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No questions yet. Pick a template or add questions below.
          </p>
        )}

        <div className="space-y-3">
          {questions.map((question, idx) => (
            <div
              key={question.id}
              className="flex gap-3 p-4 rounded-lg border border-border bg-muted/20"
            >
              {/* Drag handle (visual only) */}
              <div className="flex flex-col gap-1 pt-1 shrink-0 cursor-grab opacity-40">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-foreground" />
                    <div className="w-1 h-1 rounded-full bg-foreground" />
                  </div>
                ))}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs text-muted-foreground font-medium mr-1">
                    Q{idx + 1}
                  </span>
                  {/* Type toggle */}
                  <div className="flex rounded-md border border-border overflow-hidden text-xs">
                    <button
                      onClick={() => updateQuestion(question.id, { type: "rating" })}
                      className={[
                        "px-3 py-1.5 font-medium transition-colors",
                        question.type === "rating"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted/40",
                      ].join(" ")}
                    >
                      Rating (1-5)
                    </button>
                    <button
                      onClick={() => updateQuestion(question.id, { type: "text" })}
                      className={[
                        "px-3 py-1.5 font-medium transition-colors",
                        question.type === "text"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted/40",
                      ].join(" ")}
                    >
                      Open Text
                    </button>
                  </div>
                </div>

                <input
                  className="input-field text-sm"
                  placeholder="Enter your question..."
                  value={question.text}
                  onChange={(e) =>
                    updateQuestion(question.id, { text: e.target.value })
                  }
                />
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteQuestion(question.id)}
                className="shrink-0 mt-1 text-muted-foreground hover:text-danger transition-colors"
                aria-label="Delete question"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l1 9.5A.5.5 0 004.5 14h7a.5.5 0 00.5-.5L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="mt-4 w-full py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium"
        >
          + Add Question
        </button>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border px-6 py-4 flex items-center justify-between z-10">
        <button
          onClick={() => router.push("/dashboard/surveys")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={handleSaveDraft}>
            Save as Draft
          </button>
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={!title || questions.length === 0}
          >
            Send Survey
          </button>
        </div>
      </div>

      {/* Send confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold text-foreground mb-2">
              Send Survey
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              This will send{" "}
              <span className="font-medium text-foreground">
                &ldquo;{title}&rdquo;
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {RECIPIENT_COUNT} members
              </span>
              . They will receive an email with a link to respond.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={confirmSend}>
                Send to {RECIPIENT_COUNT} members
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
