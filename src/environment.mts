import type { Variable } from "./expression.mts";
import type { Instruction } from "./instruction.mts";

export type Environment = [Variable, Instruction][];