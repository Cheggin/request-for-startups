import { COLORS } from "@/lib/constants";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[11px] font-medium uppercase tracking-widest mb-4"
      style={{ color: COLORS.textTertiary }}
    >
      {children}
    </h2>
  );
}
