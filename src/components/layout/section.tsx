import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import type { VariantProps } from "class-variance-authority";

const sectionVariants = cva("mx-auto w-full p-4 py-8", {
  variants: {
    variant: {
      default: "",
      background: "bg-background text-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      primary: "bg-primary text-primary-foreground",
      muted: "bg-muted text-foreground",
    },
    size: {
      sm: "px-[max(theme(spacing.4),calc((100vw-768px)/2))]",
      md: "px-[max(theme(spacing.4),calc((100vw-1024px)/2))]",
      lg: "px-[max(theme(spacing.4),calc((100vw-1280px)/2))]",
      xl: "px-[max(theme(spacing.4),calc((100vw-1536px)/2))]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "xl",
  },
});

function Section({
  asChild = false,
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<"header"> &
  VariantProps<typeof sectionVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "section";

  return (
    <Comp
      className={cn(sectionVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { Section };
