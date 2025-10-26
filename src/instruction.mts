import type { Expression, Variable } from "./expression.mts";
import type { Environment } from "./environment.mts";

export type Closure = {
  type: 'Closure';
  parameter: Variable;
  body: Expression;
  env: Environment;
};
export const Closure = {
  from(parameter: Variable, body: Expression, env: Environment): Closure {
    return { type: 'Closure', parameter, body, env: structuredClone(env) };
  },
};
export type Unevaluated = {
  type: 'Unevaluated';
  value: string;
}
export const Unevaluated = {
  from(value: string): Unevaluated {
    return { type: 'Unevaluated', value };
  },
};
export const instructionToString = (inst: Instruction): string => {
  switch (inst.type) {
    case 'Unevaluated': return inst.value;
    case 'Variable': return inst.name;
    case 'Closure': return `(Closure ${inst.parameter.name})`;
  }
}
export type Instruction = Closure | Variable | Unevaluated;
export type State = Instruction[];