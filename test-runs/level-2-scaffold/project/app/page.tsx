"use client";

import { useState } from "react";
import { CountDisplay } from "@/components/count-display";
import { IncrementButton } from "@/components/increment-button";
import { ResetButton } from "@/components/reset-button";

export default function CounterPage() {
  const [count, setCount] = useState<number>(0);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <CountDisplay value={count} />
      <IncrementButton onClick={() => setCount((c) => c + 1)} />
      <ResetButton onClick={() => setCount(0)} />
    </main>
  );
}
