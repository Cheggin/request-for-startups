"use client";

import { useState, useCallback } from "react";
import { NUDGE_CONFIRM_LENGTH } from "@/lib/constants";

interface NudgeInputProps {
  paneId: string;
  label: string;
  onSent?: () => void;
}

export function NudgeInput({ paneId, label, onSent }: NudgeInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(false);

  const send = useCallback(async () => {
    if (!value.trim() || sending) return;

    if (value.length > NUDGE_CONFIRM_LENGTH) {
      const ok = window.confirm(
        `This message is ${value.length} characters. Send to ${label}?`
      );
      if (!ok) return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paneId, message: value }),
      });
      const data = await res.json();
      if (data.success) {
        setValue("");
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
        onSent?.();
      }
    } finally {
      setSending(false);
    }
  }, [value, paneId, label, sending, onSent]);

  return (
    <div className={`flex gap-2 ${flash ? "animate-nudge-flash" : ""}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="Send a nudge..."
        disabled={sending}
        aria-label={`Nudge message for ${label}`}
        className="flex-1 min-w-0 px-2 py-1 text-[13px] font-mono rounded border border-border bg-surface placeholder:text-text-tertiary focus:outline-none focus:border-info disabled:opacity-50"
      />
      <button
        type="button"
        onClick={send}
        disabled={sending || !value.trim()}
        aria-label={`Send nudge to ${label}`}
        className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide rounded border border-border bg-surface hover:bg-surface-raised disabled:opacity-30 transition-colors"
      >
        {sending ? "..." : "Send"}
      </button>
    </div>
  );
}
