export function IncrementButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      data-testid="increment-button"
      onClick={onClick}
      className="rounded-lg bg-neutral-900 px-8 py-3 text-lg font-medium text-white hover:bg-neutral-700 active:bg-neutral-800 active:scale-95 transition-all"
    >
      Increment
    </button>
  );
}
