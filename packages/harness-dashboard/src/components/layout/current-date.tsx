"use client";

import { useState, useEffect } from "react";

export function CurrentDate() {
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    );
  }, []);

  return (
    <span className="text-[12px] text-muted-foreground">{date}</span>
  );
}
