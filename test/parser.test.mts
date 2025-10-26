import { describe, it, expect } from 'vitest';
import parse from '../src/parser.mts';
import { Abstraction, Application, Variable } from '../src/expression.mts';

describe('Parser', () => {
  describe('Variables', () => {
    it('単一の変数をパース', () => {
      const result = parse('x');
      expect(result).toEqual(Variable.from('x'));
    });

    it('複数文字の変数名をパース', () => {
      const result = parse('foo');
      expect(result).toEqual(Variable.from('foo'));
    });
  });

  describe('Abstractions', () => {
    it('恒等関数: λx.x', () => {
      const result = parse('λx.x');
      expect(result).toEqual(
        Abstraction.from(Variable.from('x'), Variable.from('x'))
      );
    });

    it('バックスラッシュ記法: \\x.x', () => {
      const result = parse('\\x.x');
      expect(result).toEqual(
        Abstraction.from(Variable.from('x'), Variable.from('x'))
      );
    });

    it('ネストしたラムダ: λx.λy.x', () => {
      const result = parse('λx.λy.x');
      expect(result).toEqual(
        Abstraction.from(
          Variable.from('x'),
          Abstraction.from(Variable.from('y'), Variable.from('x'))
        )
      );
    });

    it('複数パラメータ: λx y.x は λx.λy.x と同じ', () => {
      const result = parse('λx y.x');
      expect(result).toEqual(
        Abstraction.from(
          Variable.from('x'),
          Abstraction.from(Variable.from('y'), Variable.from('x'))
        )
      );
    });

    it('3つのパラメータ: λx y z.z', () => {
      const result = parse('λx y z.z');
      expect(result).toEqual(
        Abstraction.from(
          Variable.from('x'),
          Abstraction.from(
            Variable.from('y'),
            Abstraction.from(Variable.from('z'), Variable.from('z'))
          )
        )
      );
    });
  });

  describe('Applications', () => {
    it('単純な適用: f x', () => {
      const result = parse('f x');
      expect(result).toEqual(
        Application.from(Variable.from('f'), Variable.from('x'))
      );
    });

    it('左結合: f x y は (f x) y', () => {
      const result = parse('f x y');
      expect(result).toEqual(
        Application.from(
          Application.from(Variable.from('f'), Variable.from('x')),
          Variable.from('y')
        )
      );
    });

    it('恒等関数の適用: (λx.x) a', () => {
      const result = parse('(λx.x) a');
      expect(result).toEqual(
        Application.from(
          Abstraction.from(Variable.from('x'), Variable.from('x')),
          Variable.from('a')
        )
      );
    });

    it('K combinator: (λx.λy.x) a b', () => {
      const result = parse('(λx.λy.x) a b');
      expect(result).toEqual(
        Application.from(
          Application.from(
            Abstraction.from(
              Variable.from('x'),
              Abstraction.from(Variable.from('y'), Variable.from('x'))
            ),
            Variable.from('a')
          ),
          Variable.from('b')
        )
      );
    });
  });

  describe('Parentheses', () => {
    it('括弧で囲まれた変数: (x)', () => {
      const result = parse('(x)');
      expect(result).toEqual(Variable.from('x'));
    });

    it('括弧で優先順位を変更: f (x y)', () => {
      const result = parse('f (x y)');
      expect(result).toEqual(
        Application.from(
          Variable.from('f'),
          Application.from(Variable.from('x'), Variable.from('y'))
        )
      );
    });

    it('ネストした括弧: ((x))', () => {
      const result = parse('((x))');
      expect(result).toEqual(Variable.from('x'));
    });
  });

  describe('Complex expressions', () => {
    it('自己適用: (λx.x x) (λy.y)', () => {
      const result = parse('(λx.x x) (λy.y)');
      expect(result).toEqual(
        Application.from(
          Abstraction.from(
            Variable.from('x'),
            Application.from(Variable.from('x'), Variable.from('x'))
          ),
          Abstraction.from(Variable.from('y'), Variable.from('y'))
        )
      );
    });

    it('Y combinator (簡略版): λf.(λx.f (x x)) (λx.f (x x))', () => {
      const result = parse('λf.(λx.f (x x)) (λx.f (x x))');
      const innerLambda = Abstraction.from(
        Variable.from('x'),
        Application.from(
          Variable.from('f'),
          Application.from(Variable.from('x'), Variable.from('x'))
        )
      );
      expect(result).toEqual(
        Abstraction.from(
          Variable.from('f'),
          Application.from(innerLambda, innerLambda)
        )
      );
    });

    it('シャドーイング: (λx.(λx.x) b) a', () => {
      const result = parse('(λx.(λx.x) b) a');
      expect(result).toEqual(
        Application.from(
          Abstraction.from(
            Variable.from('x'),
            Application.from(
              Abstraction.from(Variable.from('x'), Variable.from('x')),
              Variable.from('b')
            )
          ),
          Variable.from('a')
        )
      );
    });
  });

  describe('Whitespace handling', () => {
    it('前後の空白を無視', () => {
      const result = parse('  x  ');
      expect(result).toEqual(Variable.from('x'));
    });

    it('トークン間の空白を無視', () => {
      const result = parse('λ x . x');
      expect(result).toEqual(
        Abstraction.from(Variable.from('x'), Variable.from('x'))
      );
    });

    it('適用の空白は必須ではない (括弧の場合)', () => {
      const result = parse('f(x)');
      expect(result).toEqual(
        Application.from(Variable.from('f'), Variable.from('x'))
      );
    });
  });

  describe('Error handling', () => {
    it('不正な文字でエラー', () => {
      expect(() => parse('@')).toThrow('Unexpected character');
    });

    it('閉じ括弧がない場合エラー', () => {
      expect(() => parse('(x')).toThrow('Expected RPAREN');
    });

    it('パラメータのないラムダでエラー', () => {
      expect(() => parse('λ.x')).toThrow('Expected at least one parameter');
    });

    it('本体のないラムダでエラー', () => {
      expect(() => parse('λx')).toThrow('Expected DOT');
    });

    it('予期しないEOF', () => {
      expect(() => parse('λx.')).toThrow();
    });
  });
});
