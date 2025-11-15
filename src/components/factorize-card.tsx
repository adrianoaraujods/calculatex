"use client";

import * as React from "react";

import katex from "katex";
import { toast } from "sonner";

import { ExpressionType, PartialFraction } from "@/lib/partial-fractions";
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

const INITIAL_LATEX = "\\int \\frac{12x + 3}{(x - 1)(x + 2)} ~\\mathrm{d}x";

const TYPES_MAP: { [T in ExpressionType]: string } = {
  linear: "Linear",
  mixed: "Misto",
  quadratic: "Quadrática",
  unknown: "Não identificado",
};

export default function FactorizeCard({
  ...props
}: React.ComponentProps<typeof Card>) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [expression, setExpression] = React.useState(INITIAL_LATEX);
  const [output, setOutput] = React.useState("");
  const [type, setType] = React.useState<ExpressionType>("unknown");
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

  const renderedOutput = React.useMemo(() => {
    return katex.renderToString(output, {
      throwOnError: false,
      displayMode: true,
    });
  }, [output]);

  function showSolution() {
    setOutput("");
    setType("unknown");

    try {
      const partialFraction = new PartialFraction(expression);
      const type = partialFraction.type;
      const solution = partialFraction.solve();

      setOutput(solution);
      setType(type);
    } catch (error: any) {
      toast.error(String(error.message));
      return;
    }
  }

  function showExpansion() {
    setOutput("");
    setType("unknown");

    try {
      const partialFraction = new PartialFraction(expression);
      const type = partialFraction.type;
      const expansion = partialFraction.expand();

      setOutput(expansion);
      setType(type);
    } catch (error: any) {
      toast.error(String(error.message));
      return;
    }
  }

  return (
    <>
      <Card {...props}>
        <CardHeader>
          <CardTitle>
            Resolva sua Integral utilizando Frações Parciais
          </CardTitle>
          <CardDescription>
            Escreva a sua expessão abaixo utilizando LaTeX.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Heading size="md" variant="bold" asChild>
              <Label htmlFor="expression">Expressão:</Label>
            </Heading>

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
        </CardContent>

        <CardFooter>
          {type !== "unknown" && (
            <Heading size="md">
              <span className="font-bold">Tipo:</span> {TYPES_MAP[type]}
            </Heading>
          )}

          <div className="ml-auto flex gap-4">
            <Button variant="destructive" onClick={showExpansion}>
              Expandir
            </Button>

            <Button onClick={showSolution}>Resolver</Button>
          </div>
        </CardFooter>

        {output.length > 0 && (
          <CardFooter className="block">
            <Heading size="md" variant="bold">
              Resultado:
            </Heading>

            <ScrollArea>
              <div
                dangerouslySetInnerHTML={{ __html: renderedOutput }}
                className="flex"
              />

              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
