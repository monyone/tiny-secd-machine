import { describe, it, expect } from 'vitest';
import { secd } from '../src/index.mts';
import { Abstraction, Application, Variable } from '../src/expression.mts';

describe('SECD Machine', () => {
  describe('Variable', () => {
    it('未束縛の変数はそのまま返される', () => {
      const expr = Variable.from('x');
      const result = secd(expr);
      expect(result).toEqual({ type: 'Variable', name: 'x' });
    });
  });

  describe('Abstraction', () => {
    it('ラムダ抽象はクロージャになる', () => {
      // λx.x
      const expr = Abstraction.from(Variable.from('x'), Variable.from('x'));
      const result = secd(expr);
      expect(result?.type).toBe('Closure');
      expect(result).toHaveProperty('parameter');
      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('env');
    });
  });

  describe('Application', () => {
    it('恒等関数の適用: (λx.x) a = a', () => {
      // (λx.x) a
      const expr = Application.from(
        Abstraction.from(Variable.from('x'), Variable.from('x')),
        Variable.from('a')
      );
      const result = secd(expr);
      expect(result).toEqual({ type: 'Variable', name: 'a' });
    });

    it('定数関数の適用: (λx.λy.x) a b = a', () => {
      // (λx.λy.x) a b = ((λx.λy.x) a) b
      const kCombinator = Abstraction.from(
        Variable.from('x'),
        Abstraction.from(Variable.from('y'), Variable.from('x'))
      );
      const step1 = Application.from(kCombinator, Variable.from('a'));
      const expr = Application.from(step1, Variable.from('b'));
      const result = secd(expr);
      expect(result).toEqual({ type: 'Variable', name: 'a' });
    });

    it('引数の適用: (λx.λy.y) a b = b', () => {
      // (λx.λy.y) a b
      const expr = Application.from(
        Application.from(
          Abstraction.from(
            Variable.from('x'),
            Abstraction.from(Variable.from('y'), Variable.from('y'))
          ),
          Variable.from('a')
        ),
        Variable.from('b')
      );
      const result = secd(expr);
      expect(result).toEqual({ type: 'Variable', name: 'b' });
    });

    it('変数のシャドーイング: (λx.(λx.x) b) a = b', () => {
      // (λx.(λx.x) b) a
      // 外側のxは使われず、内側のλx.xにbが適用される
      const expr = Application.from(
        Abstraction.from(
          Variable.from('x'),
          Application.from(
            Abstraction.from(Variable.from('x'), Variable.from('x')),
            Variable.from('b')
          )
        ),
        Variable.from('a')
      );
      const result = secd(expr);
      expect(result).toEqual({ type: 'Variable', name: 'b' });
    });

    it('クロージャのキャプチャ: (λx.λy.x) a b = a', () => {
      // (λx.λy.x) a b
      // 内側のλyがxをキャプチャする
      const expr = Application.from(
        Application.from(
          Abstraction.from(
            Variable.from('x'),
            Abstraction.from(Variable.from('y'), Variable.from('x'))
          ),
          Variable.from('a')
        ),
        Variable.from('b')
      );
      const result = secd(expr);
      expect(result).toEqual({ type: 'Variable', name: 'a' });
    });

    it('自己適用: (λx.x x) (λy.y) = (λy.y)', () => {
      // (λx.x x) (λy.y)
      const identity = Abstraction.from(Variable.from('y'), Variable.from('y'));
      const selfApp = Abstraction.from(
        Variable.from('x'),
        Application.from(Variable.from('x'), Variable.from('x'))
      );
      const expr = Application.from(selfApp, identity);
      const result = secd(expr);
      expect(result?.type).toBe('Closure');
    });
  });
});
