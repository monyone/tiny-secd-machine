import { describe, it, expect, test } from 'vitest';
import machine from '../src/index.mts';
import parse from '../src/parser.mts';
import { Abstraction, Application, Variable } from '../src/expression.mts';
import { Closure } from '../src/instruction.mts';

describe('SECD Machine', () => {
  describe('Variable', () => {
    it('未束縛の変数はそのまま返却', () => {
      expect(machine(parse('x'))).toStrictEqual(Variable.from('x'))
    });
  });

  describe('応用', () => {
    it('church数: 0', () => {
      expect(machine(parse('λx.λf.x'))).toStrictEqual(
        Closure.from(
          Variable.from('x'),
          Abstraction.from(
            Variable.from('f'),
            Variable.from('x'),
          ),
          [],
        )
      )
    });

    it('church数: 1', () => {
      expect(machine(parse('λx.λf.f(x)'))).toStrictEqual(
        Closure.from(
          Variable.from('x'),
          Abstraction.from(
            Variable.from('f'),
            Application.from(
              Variable.from('f'),
              Variable.from('x'),
            ),
          ),
          [],
        )
      )
    });

    it('church数: 2', () => {
      expect(machine(parse('λx.λf.f(f(x))'))).toStrictEqual(
        Closure.from(
          Variable.from('x'),
          Abstraction.from(
            Variable.from('f'),
            Application.from(
              Variable.from('f'),
              Application.from(
                Variable.from('f'),
                Variable.from('x'),
              ),
            ),
          ),
          [],
        )
      )
    });

    it('church数: 掛け算 2+3=5', () => {
      const expr = parse('(λm.λn.λf.λx.((n f) ((m f) x))) (λf.λx.f(f(x))) (λf.λx.f(f(f(x)))) succ zero');

      const result = machine(expr);

      expect(result).toStrictEqual({
        type: 'Unevaluated',
        value: '(succ (succ (succ (succ (succ zero)))))'
      })
    });

    it('church数: 掛け算 2*3=6', () => {
      const expr = parse('(λm.λn.λf.λx.m (n f) x) (λf.λx.f(f(x))) (λf.λx.f(f(f(x)))) succ zero');

      const result = machine(expr);

      expect(result).toStrictEqual({
        type: 'Unevaluated',
        value: '(succ (succ (succ (succ (succ (succ zero))))))'
      })
    });

    it('church数: べき乗 2^3=8', () => {
      const expr = parse('(λm.λn.(n m)) (λf.λx.f(f(x))) (λf.λx.f(f(f(x)))) succ zero');

      const result = machine(expr);

      expect(result).toStrictEqual({
        type: 'Unevaluated',
        value: '(succ (succ (succ (succ (succ (succ (succ (succ zero))))))))'
      })
    });
  });

});