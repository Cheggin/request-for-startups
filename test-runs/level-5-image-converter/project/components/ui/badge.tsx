import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "primary" | "success" | "muted";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-surface text-foreground border border-border",
  primary: "bg-primary-light text-primary",
  success: "bg-emerald-50 text-emerald-700",
  muted: "bg-surface text-muted",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
