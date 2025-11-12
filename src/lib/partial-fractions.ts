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

  public solve(): string {
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
