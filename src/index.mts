import { Dump } from "./dump.mts";
import type { Environment } from "./environment.mts";
import { Ap, Variable, type Expression } from "./expression.mts";
import { Closure, instructionToString, type State } from "./instruction.mts";

export default (expr: Expression) => {
  let state: State = [];
  let env: Environment = [];
  let code: Expression[] = [expr];
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
          code.push(expr.operator);
          code.push(expr.operand);
          break;
        case 'Ap':
          const inst1 = state.pop()!;
          const inst2 = state.pop()!;
          if (inst1.type === 'Closure') {
            dump.push(Dump.from(state, env, code));
            state = [];
            env = [... inst1.env, [inst1.parameter, inst2]];
            code = [inst1.body];
          } else {
            state.push(Variable.from(`(${instructionToString(inst1)} ${instructionToString(inst2)})`));
          }
          break;
      }
    }
  }
}
