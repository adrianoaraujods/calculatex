"use client";

import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";
import { Section } from "@/components/layout/section";

function Navbar({
  asChild = false,
  className,
  children,
  ...props
}: React.ComponentProps<"header"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "header";

  return (
    <Section className="py-0" asChild>
      <Comp
        className={cn(
          "bg-background text-background-foreground sticky top-0 z-30 flex h-(--navbar-height) gap-4 border-b",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    </Section>
  );
}

function NavbarContent({
  asChild = false,
  className,
  children,
  ...props
}: React.ComponentProps<"nav"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "nav";

  return (
    <Comp
      className={cn(
        "flex w-full items-center justify-between gap-4",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { Navbar, NavbarContent };
