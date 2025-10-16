"use client";

import * as React from "react";

import katex from "katex";

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
import { Textarea } from "@/components/ui/textarea";

const INITIAL_LATEX =
  "\\int \\frac{Ax + B}{(x - x_{1})(x - x_{2})} ~\\mathrm{d}x";

export default function FactorizeCard({
  ...props
}: React.ComponentProps<typeof Card>) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(INITIAL_LATEX);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const renderedHtml = React.useMemo(() => {
    return katex.renderToString(value, {
      throwOnError: false,
      displayMode: true,
    });
  }, [value]);

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Fatorar Equação de Segundo Grau!</CardTitle>
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
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setIsEditing(false)}
              spellCheck={false}
            />
          ) : (
            <div
              className="border-input aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              onClick={() => setIsEditing(true)}
              onFocus={() => setIsEditing(true)}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
              role="button"
              tabIndex={0}
            />
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-row-reverse">
        <Button>Fatorar</Button>
      </CardFooter>
    </Card>
  );
}
