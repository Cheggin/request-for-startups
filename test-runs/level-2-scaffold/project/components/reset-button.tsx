export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      data-testid="reset-button"
      onClick={onClick}
      className="rounded-lg bg-neutral-200 px-8 py-3 text-lg font-medium text-neutral-900 hover:bg-neutral-300 active:bg-neutral-400 active:scale-95 transition-all"
    >
      Reset
    </button>
  );
}
