export function CountDisplay({ value }: { value: number }) {
  return (
    <div
      data-testid="count-display"
      className="text-8xl font-bold tabular-nums tracking-tight"
    >
      {value}
    </div>
  );
}
