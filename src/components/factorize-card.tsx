"use client";

import * as React from "react";

import katex from "katex";
import { toast } from "sonner";

import { PartialFraction } from "@/lib/partial-fractions";
import { Heading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const INITIAL_LATEX = "\\int \\frac{5x + 3}{(x + 2)(x - 2)} ~\\mathrm{d}x";

export default function FactorizeCard({
  ...props
}: React.ComponentProps<typeof Card>) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [expression, setExpression] = React.useState(INITIAL_LATEX);
  const [solution, setSolution] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const renderedExpression = React.useMemo(() => {
    return katex.renderToString(expression, {
      throwOnError: false,
      displayMode: true,
    });
  }, [expression]);

  const renderedSolution = React.useMemo(() => {
    return katex.renderToString(solution, {
      throwOnError: false,
      displayMode: true,
    });
  }, [solution]);

  function handleClick() {
    try {
      const partialFraction = new PartialFraction(expression);

      const solution = partialFraction.solve();

      setSolution(solution);
    } catch (error: any) {
      toast.error(String(error.message));
      return;
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Resolva sua Integral utilizando Frações Parciais</CardTitle>
        <CardDescription>
          Escreva a sua expessão abaixo utilizando LaTeX.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="expression">Expressão:</Label>

          {isEditing ? (
            <Textarea
              id="expression"
              ref={textareaRef}
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onBlur={() => setIsEditing(false)}
              spellCheck={false}
            />
          ) : (
            <div
              className="border-input aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-24 w-full cursor-text overflow-hidden rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
              onClick={() => setIsEditing(true)}
              onFocus={() => setIsEditing(true)}
              dangerouslySetInnerHTML={{ __html: renderedExpression }}
              role="button"
              tabIndex={0}
            />
          )}
        </div>

        {solution.length > 0 && (
          <>
            <Heading size="md">Solução:</Heading>

            <ScrollArea>
              <div dangerouslySetInnerHTML={{ __html: renderedSolution }} />

              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </>
        )}
      </CardContent>

      <CardFooter className="flex-row-reverse">
        <Button onClick={handleClick}>Fatorar</Button>
      </CardFooter>
    </Card>
  );
}
