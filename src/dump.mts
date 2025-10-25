import type { Environment } from "./environment.mts";
import type { Code } from "./expression.mts";
import type { State } from "./instruction.mts"

export type Dump = {
  state: State;
  env: Environment;
  code: Code;
};
export const Dump = {
  from(state: State, env: Environment, code: Code): Dump {
    return {
      state: structuredClone(state),
      env: structuredClone(env),
      code: structuredClone(code),
    };
  }
}