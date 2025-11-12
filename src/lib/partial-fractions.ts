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

  private extractRoots(denominator: string): Factor[] {
    const factors: Factor[] = [];
    const factorRegex = /\(([\s\S]*?)\)(?:\^\s*\{?(\d+)\}?)?/g;

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

  public solve(): string {
    const partialFractionForm = this.getPartialFractionForm();
    const expandedForm = this.getExpandedForm();

    let result = "";

    if (this.type === "linear") {
      if (
        this.factors.length > 2 || // Limita ao caso de 2 fatores
        this.factors[0].multiplicity > 1 ||
        this.factors[1].multiplicity > 1
      ) {
        throw new Error("A expressão não é suportada.");
      }

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
