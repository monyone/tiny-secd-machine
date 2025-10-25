import type { Variable } from "./expression.mjs";
import type { Instruction } from "./instruction.mjs";

export type Environment = [Variable, Instruction][];