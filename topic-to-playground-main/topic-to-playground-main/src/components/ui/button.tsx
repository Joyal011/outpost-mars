import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        mission:
          "rounded-2xl bg-primary font-display text-base font-semibold text-primary-foreground shadow-[0_5px_0_0_oklch(0.5_0.16_38)] hover:-translate-y-0.5 hover:bg-primary/95 active:translate-y-1 active:shadow-none transition-transform",
        sunny:
          "rounded-2xl bg-accent font-display text-base font-semibold text-accent-foreground shadow-[0_5px_0_0_oklch(0.66_0.14_80)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-transform",
        panel:
          "rounded-2xl border-2 border-rim bg-panel font-display text-foreground shadow-[var(--shadow-glow)] hover:border-highlight",
        tab: "w-full justify-start rounded-2xl border-2 border-rim bg-panel font-display text-lg font-semibold text-foreground hover:border-highlight data-[active=true]:border-highlight data-[active=true]:bg-panel-strong data-[active=true]:shadow-[var(--shadow-highlight)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        xl: "h-14 px-8 text-lg [&_svg]:size-5",
        iconLg: "h-14 w-14 [&_svg]:size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
