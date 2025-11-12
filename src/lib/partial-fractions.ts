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
    return `\\begin{array}{l} \\displaystyle
      \\frac{${this.numerator}}{${this.denominator}} = 
    \\end{array}`;
  }
}
