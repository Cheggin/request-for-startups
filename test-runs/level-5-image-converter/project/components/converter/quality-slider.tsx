"use client";

interface QualitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function QualitySlider({ value, onChange }: QualitySliderProps) {
  const percentage = Math.round(value * 100);

  return (
    <div data-testid="quality-slider" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="quality-range" className="text-sm font-medium text-foreground">
          Quality
        </label>
        <span className="text-sm tabular-nums text-muted" data-testid="quality-value">
          {percentage}%
        </span>
      </div>
      <input
        id="quality-range"
        type="range"
        min="10"
        max="100"
        step="1"
        value={percentage}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full cursor-pointer"
        data-testid="quality-range-input"
      />
      <div className="flex justify-between text-[11px] text-muted">
        <span>Smaller file</span>
        <span>Higher quality</span>
      </div>
    </div>
  );
}
