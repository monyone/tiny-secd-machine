import { Dump } from "./dump.mts";
import type { Environment } from "./environment.mts";
import { Ap, Variable, type Code, type Expression } from "./expression.mts";
import { Closure, instructionToString, Unevaluated, type State } from "./instruction.mts";

export default (expr: Expression) => {
  let state: State = [];
  let env: Environment = [];
  let code: Code = [expr];
  let dump: Dump[] = [];

  while (true) {
    if (code.length === 0) {
      if (dump.length === 0) {
        return state[0];
      }
      const restore = dump.pop()!;
      state = [...restore.state, ...state];
      env = restore.env;
      code = restore.code;
    } else {
      const expr = code.pop()!;

      switch (expr.type) {
        case 'Abstraction':
          state.push(Closure.from(expr.parameter, expr.body, env));
          break;
        case 'Variable':
          state.push(env.findLast((e) => e[0].name === expr.name)?.[1] ?? Variable.from(expr.name));
          break;
        case 'Application':
          code.push(Ap.from());
          code.push(expr.operand);
          code.push(expr.operator);
          break;
        case 'Ap':
          const operand = state.pop()!;
          const operator = state.pop()!;
          if (operator.type === 'Closure') {
            dump.push(Dump.from(state, env, code));
            state = [];
            env = [... operator.env, [operator.parameter, operand]];
            code = [operator.body];
          } else {
            state.push(Unevaluated.from(`(${instructionToString(operator)} ${instructionToString(operand)})`));
          }
          break;
      }
    }
  }
}
