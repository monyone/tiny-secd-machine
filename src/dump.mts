import type { Environment } from "./environment.mts";
import type { Expression } from "./expression.mts";
import type { State } from "./instruction.mts"

export type Dump = {
  state: State;
  env: Environment;
  code: Expression[];
};
export const Dump = {
  from(state: State, env: Environment, code: Expression[]): Dump {
    return { state, env, code };
  }
}