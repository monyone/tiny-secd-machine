import type { Expression, Variable } from "./expression.mts";
import type { Environment } from "./environment.mts";

export type Closure = {
  type: 'Closure';
  parameter: Variable;
  body: Expression;
  env: Environment;
};
export const Closure = {
  form(parameter: Variable, body: Expression, env: Environment): Closure {
    return { type: 'Closure', parameter, body, env: structuredClone(env) };
  },
};
export const instructionToString = (inst: Instruction): string => {
  switch (inst.type) {
    case 'Variable': return inst.name;
    case 'Closure': return `(Closure ${inst.parameter.name})`;
  }
}
export type Instruction = Closure | Variable;
export type State = Instruction[];