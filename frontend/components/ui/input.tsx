import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors duration-150",
          "bg-[var(--input-bg)] border border-[var(--border-mid)] text-[var(--text-primary)]",
          "placeholder:text-[var(--text-muted)]",
          "focus:bg-[var(--input-focus-bg)] focus:border-emerald-500/60",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
