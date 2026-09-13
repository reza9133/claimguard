import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 select-none",
  {
    variants: {
      variant: {
        primary: "btn-primary text-white rounded-xl",
        outline: [
          "rounded-xl",
          "bg-[var(--surface-subtle)] hover:bg-[var(--surface-raised)]",
          "border border-[var(--border-mid)] hover:border-[var(--border-strong)]",
          "text-[var(--text-secondary)]",
        ].join(" "),
        ghost: "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-xl",
        destructive: [
          "text-red-400 rounded-xl",
          "bg-red-500/10 hover:bg-red-500/20",
          "border border-red-500/20 hover:border-red-500/40",
        ].join(" "),
        success: [
          "text-emerald-400 rounded-xl",
          "bg-emerald-500/10 hover:bg-emerald-500/20",
          "border border-emerald-500/20 hover:border-emerald-500/40",
        ].join(" "),
      },
      size: {
        sm: "px-3.5 py-1.5 text-xs rounded-lg",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3.5 text-sm",
        xl: "px-8 py-4 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";
