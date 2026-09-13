import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors duration-150 resize-y",
        "bg-[var(--input-bg)] border border-[var(--border-mid)] text-[var(--text-primary)]",
        "placeholder:text-[var(--text-muted)]",
        "focus:bg-[var(--input-focus-bg)] focus:border-emerald-500/60",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
