import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-mid)]",
        success: "bg-emerald-500/12 text-emerald-400 border border-emerald-500/25",
        danger: "bg-red-500/12 text-red-400 border border-red-500/25",
        warning: "bg-amber-500/12 text-amber-400 border border-amber-500/25",
        info: "bg-sky-500/12 text-sky-400 border border-sky-500/25",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
