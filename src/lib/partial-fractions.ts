export type ExpressionType = FactorType | "mixed" | "unknown";
export type FactorType = "linear" | "quadratic";

export type Factor = {
  type: FactorType;
  content: string;
  multiplicity: number;
  root?: string;
};

export type Coefficient = {
  power: number;
  value: string;
};

export class PartialFraction {
  public type: ExpressionType = "unknown";

  public numerator!: string;
  public denominator!: string;

  private coefficients: Coefficient[];
  private factors: Factor[];

  private hasLinear: boolean = false;
  private hasQuadratic: boolean = false;

  constructor(public rawExpression: string) {
    // 1. Split the fraction
    this.splitFraction(rawExpression);

    // 2. Parse numerator and denominator
    this.coefficients = this.extractCoefficients(this.numerator);
    this.factors = this.extractRoots(this.denominator);
    // 3. Set the expression type based on factors
    this.setExpressionType();
  }

  private splitFraction(expression: string) {
    const fractionRegex = /\\frac\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}/;
    const fractionMatch = expression.match(fractionRegex);

    if (!fractionMatch) throw new Error("A expressão deve ter uma fração.");

    this.numerator = fractionMatch[1].trim();
    this.denominator = fractionMatch[2].trim();
  }

  private extractCoefficients(numerator: string): Coefficient[] {
    const coefficients: Coefficient[] = [];

    let normNum = numerator.replace(/\s+/g, "");
    if (normNum.charAt(0) !== "-" && normNum.charAt(0) !== "+") {
      normNum = "+" + normNum;
    }

    const termRegex = /([\+\-][^ \+\-]+)/g;
    const terms = normNum.match(termRegex) || [];
    const parseTermRegex = /([\+\-])(?:(\w+)?(?:\*?x)(?:\^\{?(\d+)\}?)?|(\w+))/;

    for (const term of terms) {
      const match = term.match(parseTermRegex);
      if (!match) continue;

      const sign = match[1] === "-" ? "-" : "+";
      let value = "";
      let power = 0;

      const coeffPart = match[2];
      const powerPart = match[3];
      const constantPart = match[4];

      if (constantPart) {
        power = 0;
        value = sign + constantPart;
      } else {
        if (powerPart) {
          power = parseInt(powerPart, 10);
        } else {
          power = 1;
        }
        if (!coeffPart || coeffPart === "") {
          value = sign + "1";
        } else {
          value = sign + coeffPart;
        }
      }

      coefficients.push({ power, value });
    }
    return coefficients;
  }

  /**
   * Extrai os coeficientes a, b, e c de um polinômio de segundo grau.
   * Ex: "x^2 - 4x + 2" retorna { a: 1, b: -4, c: 2 }
   */
  private getPolynomialCoefficients(poly: string): {
    a: number;
    b: number;
    c: number;
  } {
    const coeffMap = new Map<number, number>();
    // Normaliza a string: remove espaços, substitui "-" por "+-" para facilitar o split
    let normPoly = poly.replace(/\s+/g, "").replace(/\-/g, "+-");

    // Garante que comece com um sinal se não for o caso
    if (normPoly.startsWith("+")) {
      normPoly = normPoly.substring(1);
    }

    const terms = normPoly.split("+");

    for (const term of terms) {
      if (term.includes("x^2")) {
        const val = term.split("x^2")[0];
        // Coeficiente de x^2: "" -> 1, "-" -> -1
        coeffMap.set(2, val === "" ? 1 : val === "-" ? -1 : Number(val));
      } else if (term.includes("x")) {
        const val = term.split("x")[0];
        // Coeficiente de x: "" -> 1, "-" -> -1
        coeffMap.set(1, val === "" ? 1 : val === "-" ? -1 : Number(val));
      } else if (term !== "") {
        // Termo constante
        coeffMap.set(0, Number(term));
      }
    }

    return {
      a: coeffMap.get(2) || 0,
      b: coeffMap.get(1) || 0,
      c: coeffMap.get(0) || 0,
    };
  }

  private extractRoots(denominator: string): Factor[] {
    const factors: Factor[] = [];
    // 1. Tenta encontrar fatores já existentes (ex: (x-3)(x-7))
    const factorRegex = /\(([\s\S]*?)\)(?:\^\s*\{?(\d+)\}?)?/g;

    if (denominator.includes("(")) {
      let match;
      while ((match = factorRegex.exec(denominator)) !== null) {
        const content = match[1].trim();
        const multiplicity = match[2] ? parseInt(match[2], 10) : 1;

        const isQuadratic = /x\s*\^/.test(content);
        const type = isQuadratic ? "quadratic" : "linear";

        const factor: Factor = {
          type: type,
          content: content,
          multiplicity: multiplicity,
        };

        if (type === "linear") {
          this.hasLinear = true;

          const normContent = content.replace(/\s+/g, "");
          const rootMatch = normContent.match(/^x([\+\-])(.*)$/);

          if (rootMatch) {
            const sign = rootMatch[1];
            const rootVal = rootMatch[2];
            factor.root = (sign === "+" ? "-" : "+") + rootVal;
          } else if (normContent === "x") {
            factor.root = "0";
          }
        } else {
          this.hasQuadratic = true;
        }

        factors.push(factor);
      }
    } else {
      // 2. Se NENHUM fator foi encontrado (ex: "x^2 - 4x + 2")

      const { a, b, c } = this.getPolynomialCoefficients(denominator);

      if (a !== 0) {
        // É uma equação de segundo grau (ax^2 + bx + c)
        const delta = b * b - 4 * a * c;

        if (delta > 0) {
          // Duas raízes reais distintas
          const r1 = (-b + Math.sqrt(delta)) / (2 * a);
          const r2 = (-b - Math.sqrt(delta)) / (2 * a);

          // Formata as raízes para string, ex: "x - 5.123" ou "x + 2.123"
          factors.push({
            type: "linear",
            content: `x ${r1 > 0 ? "-" : "+"} ${Math.abs(r1)}`,
            multiplicity: 1,
            root: `${r1}`,
          });
          factors.push({
            type: "linear",
            content: `x ${r2 > 0 ? "-" : "+"} ${Math.abs(r2)}`,
            multiplicity: 1,
            root: `${r2}`,
          });
          this.hasLinear = true;
        } else if (delta === 0) {
          // Uma raiz real (multiplicidade 2)
          const r1 = -b / (2 * a);
          factors.push({
            type: "linear",
            content: `x ${r1 > 0 ? "-" : "+"} ${Math.abs(r1)}`,
            multiplicity: 2,
            root: `${r1}`,
          });
          this.hasLinear = true;
        } else {
          // Nenhuma raiz real (quadrático irredutível)
          factors.push({
            type: "quadratic",
            content: denominator, // O próprio polinômio
            multiplicity: 1,
          });
          this.hasQuadratic = true;
        }
      } else if (b !== 0) {
        // É uma equação linear (bx + c)
        const r1 = -c / b;
        factors.push({
          type: "linear",
          content: `x ${r1 > 0 ? "-" : "+"} ${Math.abs(r1)}`,
          multiplicity: 1,
          root: `${r1}`,
        });
        this.hasLinear = true;
      } else {
        // É apenas uma constante? Tratar como quadrático para evitar erros.
        factors.push({
          type: "quadratic",
          content: denominator,
          multiplicity: 1,
        });
        this.hasQuadratic = true;
      }
    }

    return factors;
  }

  private setExpressionType(): void {
    if (this.hasLinear && !this.hasQuadratic) {
      this.type = "linear";
    } else if (!this.hasLinear && this.hasQuadratic) {
      this.type = "quadratic";
    } else if (this.hasLinear && this.hasQuadratic) {
      this.type = "mixed";
    } else {
      this.type = "unknown";
    }
  }

  public expand() {
    const partialFractionForm = this.getPartialFractionForm();
    const expandedForm = this.getExpandedForm();

    return `\\begin{array}{l} \\displaystyle
      ${partialFractionForm}
      \\\\ \\\\ \\displaystyle
      \\frac{${this.numerator}}{${this.denominator}} = \\frac{${expandedForm}}{${this.denominator}}
      \\\\ \\\\ \\displaystyle
      ${this.numerator} = ${expandedForm}
    \\end{array}`;
  }

  public solve(): string {
    const partialFractionForm = this.getPartialFractionForm();
    const expandedForm = this.getExpandedForm();

    let result = "";

    if (
      this.factors.length > 2 ||
      this.factors[0].multiplicity > 1 ||
      this.factors[1].multiplicity > 1
    ) {
      throw new Error("A expressão não é suportada.");
    }

    if (this.type === "linear") {
      const c1_coeff = this.coefficients.find((c) => c.power === 1);
      const c2_coeff = this.coefficients.find((c) => c.power === 0);

      const c1 = c1_coeff ? Number(c1_coeff.value) : 0; // Coeficiente de x
      const c2 = c2_coeff ? Number(c2_coeff.value) : 0; // Constante

      const r1 = Number(this.factors[0].root!);
      const r2 = Number(this.factors[1].root!);

      const A = (c1 * r1 + c2) / (r1 - r2);
      const B = (c1 * r2 + c2) / (r2 - r1);

      result = `
        A = ${A} \\qquad B = ${B}

        \\\\ \\\\ \\displaystyle

        \\frac{${A}}{${this.factors[0].content}} +
        \\frac{${B}}{${this.factors[1].content}}

        \\\\ \\\\ \\displaystyle

        \\int \\frac{${A}}{${this.factors[0].content}} ~\\mathrm{d}x +
        \\int \\frac{${B}}{${this.factors[1].content}} ~\\mathrm{d}x

        \\\\ \\\\ \\displaystyle

        ${A} \\cdot \\int \\frac{1}{${this.factors[0].content}} ~\\mathrm{d}x +
        ${B} \\cdot \\int \\frac{1}{${this.factors[1].content}} ~\\mathrm{d}x

        \\\\ \\\\ \\displaystyle

        ${A} \\cdot \\ln | ${this.factors[0].content} | +
        ${B} \\cdot \\ln | ${this.factors[1].content} | + C
      `;
    } else if (this.type === "quadratic") {
      const c1_coeff = this.coefficients.find((c) => c.power === 1);
      const c2_coeff = this.coefficients.find((c) => c.power === 0);

      const c1 = c1_coeff ? Number(c1_coeff.value) : 0; // Coeficiente de x
      const c2 = c2_coeff ? Number(c2_coeff.value) : 0; // Constante

      const r1 = -Number(
        this.extractCoefficients(this.factors[0].content)[1].value
      );
      const r2 = -Number(
        this.extractCoefficients(this.factors[1].content)[1].value
      );

      const A = c1 / (r1 - r2);
      const B = -c2 / (r2 - r1);
      const C = -c1 / (r1 - r2);
      const D = c2 / (r2 - r1);

      result = `
        A = ${A} \\qquad B = ${B} \\qquad C = ${C} \\qquad D = ${D}

        \\\\ \\\\ \\displaystyle

        \\frac{${A}x ${B < 0 ? B : ` + ${B}`}}{${this.factors[0].content}} +
        \\frac{${C}x ${D < 0 ? D : ` + ${D}`}}{${this.factors[1].content}}

        \\\\ \\\\ \\displaystyle

        \\int \\frac{${A}x ${B < 0 ? B : ` + ${B}`}}{${this.factors[0].content}} ~\\mathrm{d}x +
        \\int \\frac{${C}x ${D < 0 ? D : ` + ${D}`}}{${this.factors[1].content}} ~\\mathrm{d}x

        \\\\ \\\\ \\displaystyle

        \\int \\dfrac{${A}x}{${this.factors[0].content}} ~\\mathrm{d}x +
        \\int \\dfrac{${B}} {${this.factors[0].content}} ~\\mathrm{d}x +
        \\int \\dfrac{${C}x}{${this.factors[1].content}} ~\\mathrm{d}x +
        \\int \\dfrac{${D}} {${this.factors[1].content}} ~\\mathrm{d}x

        \\\\ \\\\ \\displaystyle

        ${A}                     \\cdot \\int \\dfrac{x}{${this.factors[0].content}} ~\\mathrm{d}x
        ${B < 0 ? B : ` + ${B}`} \\cdot \\int \\dfrac{1}{${this.factors[0].content}} ~\\mathrm{d}x
        ${C < 0 ? C : ` + ${C}`} \\cdot \\int \\dfrac{x}{${this.factors[1].content}} ~\\mathrm{d}x
        ${D < 0 ? D : ` + ${D}`} \\cdot \\int \\dfrac{1}{${this.factors[1].content}} ~\\mathrm{d}x

        \\\\ \\\\ \\displaystyle

        u_{1} = ${this.factors[0].content} \\qquad u_{2} = ${this.factors[1].content} 
        
        \\\\ \\\\ \\displaystyle
        
        \\mathrm{d}u = 2x ~dx ~~\\implies~~ \\mathrm{d}x = \\dfrac{1}{2x} ~\\mathrm{d}u

        \\\\ \\\\ \\displaystyle

        ${A}                     \\cdot \\int \\dfrac{\\cancel{ x }}{u_{1}} \\cdot \\dfrac{1}{2\\cancel{ x }} ~\\mathrm{d}u
        ${B < 0 ? B : ` + ${B}`} \\cdot \\int \\dfrac{1}{${this.factors[0].content}} ~\\mathrm{d}x
        ${C < 0 ? C : ` + ${C}`} \\cdot \\int \\dfrac{\\cancel{ x }}{u_{2}} \\cdot \\dfrac{1}{2\\cancel{ x }} ~\\mathrm{d}u
        ${D < 0 ? D : ` + ${D}`} \\cdot \\int \\dfrac{1}{${this.factors[1].content}} ~\\mathrm{d}x

        \\\\ \\\\ \\displaystyle

        ${A < 0 ? `- \\dfrac{${-A}}{2}` : `\\dfrac{${A}}{2}`} \\cdot \\int \\dfrac{1}{u_{1}} ~\\mathrm{d}u
        ${B < 0 ? B : ` + ${B}`} \\cdot \\int \\dfrac{1}{${this.factors[0].content}} ~\\mathrm{d}x
        ${C < 0 ? `- \\dfrac{${-C}}{2}` : `+ \\dfrac{${C}}{2}`} \\cdot \\int \\dfrac{1}{u_{2}} ~\\mathrm{d}u
        ${D < 0 ? D : ` + ${D}`} \\cdot \\int \\dfrac{1}{${this.factors[1].content}} ~\\mathrm{d}x

        \\\\ \\\\ \\displaystyle

        ${A / 2} \\cdot \\ln | u_{1} |
        ${B < 0 ? B : `+ ${B}`} \\cdot ${
          -r1 < 0
            ? `\\dfrac{1}{2 \\cdot \\sqrt{${r1}}} \\ln \\left| \\dfrac{x - \\sqrt{${r1}}}{x + \\sqrt{${r1}}} \\right|`
            : `\\dfrac{1}{\\sqrt{${-r1}}} \\arctan \\left( \\dfrac{x}{\\sqrt{${-r1}}} \\right)`
        }
        ${C < 0 ? C / 2 : `+ ${C / 2}`} \\cdot \\ln | u_{2} |
        ${D < 0 ? D : `+ ${D}`} \\cdot ${
          -r2 < 0
            ? `\\dfrac{1}{2 \\cdot \\sqrt{${r2}}} \\ln \\left| \\dfrac{x - \\sqrt{${r2}}}{x + \\sqrt{${r2}}} \\right|`
            : `\\dfrac{1}{\\sqrt{${-r2}}} \\arctan \\left( \\dfrac{x}{\\sqrt{${-r2}}} \\right)`
        } + C

        \\\\ \\\\ \\displaystyle

        ${A / 2} \\cdot \\ln | ${this.factors[0].content} |
        ${B < 0 ? B : `+ ${B}`} \\cdot ${
          -r1 < 0
            ? `\\dfrac{1}{2 \\cdot \\sqrt{${r1}}} \\ln \\left| \\dfrac{x - \\sqrt{${r1}}}{x + \\sqrt{${r1}}} \\right|`
            : `\\dfrac{1}{\\sqrt{${-r1}}} \\arctan \\left( \\dfrac{x}{\\sqrt{${-r1}}} \\right)`
        }
        ${C < 0 ? C / 2 : `+ ${C / 2}`} \\cdot \\ln | ${this.factors[1].content} |
        ${D < 0 ? D : `+ ${D}`} \\cdot ${
          -r2 < 0
            ? `\\dfrac{1}{2 \\cdot \\sqrt{${r2}}} \\ln \\left| \\dfrac{x - \\sqrt{${r2}}}{x + \\sqrt{${r2}}} \\right|`
            : `\\dfrac{1}{\\sqrt{${-r2}}} \\arctan \\left( \\dfrac{x}{\\sqrt{${-r2}}} \\right)`
        } + C
        `;
    } else {
      throw new Error("Tipo de expressão não suportado.");
    }

    return `\\begin{array}{l} \\displaystyle
      ${partialFractionForm}
      \\\\ \\\\ \\displaystyle
      \\frac{${this.numerator}}{${this.denominator}} = \\frac{${expandedForm}}{${this.denominator}}
      \\\\ \\\\ \\displaystyle
      ${this.numerator} = ${expandedForm}
      \\\\ \\\\ \\displaystyle
      ${result}
    \\end{array}`;
  }

  private getPartialFractionForm(): string {
    const rawTerms: string[] = [];

    let symbol = 65; // 'A' in ASC II
    for (let i = 0; i < this.factors.length; i++) {
      const { content, multiplicity, type } = this.factors[i];

      if (type === "linear") {
        rawTerms.push(`\\frac{${String.fromCharCode(symbol++)}}{${content}}`);

        for (let j = 2; j <= multiplicity; j++) {
          rawTerms.push(
            `\\frac{${String.fromCharCode(symbol++)}}{(${content})^{${j}}}`
          );
        }
      } else {
        rawTerms.push(
          `\\frac{${String.fromCharCode(symbol++)}x + ${String.fromCharCode(symbol++)}}{${content}}`
        );

        for (let j = 2; j <= multiplicity; j++) {
          rawTerms.push(
            `\\frac{${String.fromCharCode(symbol++)}x + ${String.fromCharCode(symbol++)}}{(${content})^{${j}}}`
          );
        }
      }
    }

    return `\\frac{${this.numerator}}{${this.denominator}} = ${rawTerms.join(" + ")}`;
  }

  private getExpandedForm(): string {
    const multipliedTerms: string[] = [];

    let symbol = 65; // 'A' in ASC II
    for (let i = 0; i < this.factors.length; i++) {
      const { content, multiplicity, type } = this.factors[i];

      if (type === "linear") {
        const multipliedTerm: string[] = [];

        for (let j = 0; j < this.factors.length; j++) {
          if (i === j) continue;

          const power = this.factors[j].multiplicity;

          multipliedTerm.push(
            `(${this.factors[j].content})${power < 2 ? "" : `^{${power}}`}`
          );
        }

        multipliedTerms.push(
          [
            String.fromCharCode(symbol++),
            multiplicity < 2
              ? ""
              : `(${content})${multiplicity > 2 ? `^{${multiplicity - 1}}` : ""}`,
            multipliedTerm,
          ].join("")
        );

        for (let j = 2; j <= multiplicity; j++) {
          multipliedTerms.push(
            [
              String.fromCharCode(symbol++),
              multiplicity - j < 1
                ? ""
                : `(${content})${multiplicity - j > 2 ? `^{${multiplicity - j - 1}}` : ""}`,
              multipliedTerm,
            ].join("")
          );
        }
      } else {
        const term = `${String.fromCharCode(symbol++)}x + ${String.fromCharCode(symbol++)}`;

        const multipliedTerm: string[] = [];

        for (let j = 0; j < this.factors.length; j++) {
          if (i === j) continue;

          const power = this.factors[j].multiplicity;

          multipliedTerm.push(
            `(${this.factors[j].content})${power < 2 ? "" : `^{${power}}`}`
          );
        }

        multipliedTerms.push(
          [
            `(${term})`,
            multiplicity < 2
              ? ""
              : `(${content})${multiplicity > 2 ? `^{${multiplicity - 1}}` : ""}`,
            multipliedTerm,
          ].join("")
        );

        for (let j = 2; j <= multiplicity; j++) {
          const term = `${String.fromCharCode(symbol++)}x + ${String.fromCharCode(symbol++)}`;

          multipliedTerms.push(
            [
              `(${term})`,
              multiplicity - j < 1
                ? ""
                : `(${content})${multiplicity - j > 2 ? `^{${multiplicity - j - 1}}` : ""}`,
              multipliedTerm,
            ].join("")
          );
        }
      }
    }

    return multipliedTerms.join(" + ");
  }
}
