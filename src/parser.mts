import { Abstraction, Application, Variable, type Expression } from './expression.mts';

type TokenType = 'LAMBDA' | 'DOT' | 'LPAREN' | 'RPAREN' | 'IDENT' | 'EOF';

type Token = {
  type: TokenType;
  value: string;
  position: number;
};
class Lexer {
  private input: string;
  private position: number = 0;

  constructor(input: string) {
    this.input = input;
  }

  private peek(): string | null {
    if (this.position >= this.input.length) return null;
    return this.input[this.position] ?? null;
  }

  private advance(): string | null {
    if (this.position >= this.input.length) return null;
    return this.input[this.position++] ?? null;
  }

  private skipWhitespace(): void {
    while (this.peek() && /\s/.test(this.peek()!)) {
      this.advance();
    }
  }

  private readIdent(): string {
    let ident = '';
    while (this.peek() && /[a-zA-Z0-9_]/.test(this.peek()!)) {
      ident += this.advance();
    }
    return ident;
  }

  nextToken(): Token {
    this.skipWhitespace();

    const pos = this.position;
    const ch = this.peek();

    if (ch === null) {
      return { type: 'EOF', value: '', position: pos };
    }

    // λまたは\でラムダ
    if (ch === 'λ' || ch === '\\') {
      this.advance();
      return { type: 'LAMBDA', value: ch, position: pos };
    }

    // ドット
    if (ch === '.') {
      this.advance();
      return { type: 'DOT', value: '.', position: pos };
    }

    // 左括弧
    if (ch === '(') {
      this.advance();
      return { type: 'LPAREN', value: '(', position: pos };
    }

    // 右括弧
    if (ch === ')') {
      this.advance();
      return { type: 'RPAREN', value: ')', position: pos };
    }

    // 識別子
    if (/[a-zA-Z_]/.test(ch)) {
      const ident = this.readIdent();
      return { type: 'IDENT', value: ident, position: pos };
    }

    throw new Error(`Unexpected character '${ch}' at position ${pos}`);
  }
}

// パーサー（構文解析器）
class Parser {
  private lexer: Lexer;
  private currentToken: Token;

  constructor(input: string) {
    this.lexer = new Lexer(input);
    this.currentToken = this.lexer.nextToken();
  }

  private advance(): void {
    this.currentToken = this.lexer.nextToken();
  }

  private expect(type: TokenType): Token {
    if (this.currentToken.type !== type) {
      throw new Error(
        `Expected ${type} but got ${this.currentToken.type} at position ${this.currentToken.position}`
      );
    }
    const token = this.currentToken;
    this.advance();
    return token;
  }

  // expression := application
  parse(): Expression {
    const expr = this.parseApplication();
    this.expect('EOF');
    return expr;
  }

  // application := term (term)*
  // 左結合: f x y は (f x) y
  private parseApplication(): Expression {
    let expr = this.parseTerm();

    while (
      this.currentToken.type === 'IDENT' ||
      this.currentToken.type === 'LPAREN' ||
      this.currentToken.type === 'LAMBDA'
    ) {
      const operand = this.parseTerm();
      expr = Application.from(expr, operand);
    }

    return expr;
  }

  // term := variable | abstraction | '(' expression ')'
  private parseTerm(): Expression {
    // 変数
    if (this.currentToken.type === 'IDENT') {
      const token = this.expect('IDENT');
      return Variable.from(token.value);
    }

    // ラムダ抽象
    if (this.currentToken.type === 'LAMBDA') {
      return this.parseAbstraction();
    }

    // 括弧
    if (this.currentToken.type === 'LPAREN') {
      this.expect('LPAREN');
      const expr = this.parseApplication();
      this.expect('RPAREN');
      return expr;
    }

    throw new Error(
      `Unexpected token ${this.currentToken.type} at position ${this.currentToken.position}`
    );
  }

  // abstraction := 'λ' IDENT '.' expression
  // または複数のパラメータ: λx y z.body は λx.λy.λz.body と同じ
  private parseAbstraction(): Expression {
    this.expect('LAMBDA');

    const params: Variable[] = [];
    while (this.currentToken.type === 'IDENT') {
      const token = this.expect('IDENT');
      params.push(Variable.from(token.value));
    }

    if (params.length === 0) {
      throw new Error(
        `Expected at least one parameter after λ at position ${this.currentToken.position}`
      );
    }

    this.expect('DOT');
    let body = this.parseApplication();

    // 右から左にネストしたラムダを構築
    for (let i = params.length - 1; i >= 0; i--) {
      body = Abstraction.from(params[i]!, body);
    }

    return body;
  }
}

export default (input: string): Expression => {
  const parser = new Parser(input);
  return parser.parse();
}
