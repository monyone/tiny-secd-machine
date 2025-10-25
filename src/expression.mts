export type Variable = {
  type: 'Variable';
  name: string;
};
export const Variable = {
  from(name: string): Variable {
    return { type: 'Variable', name };
  },
};
export type Abstraction = {
  type: 'Abstraction';
  parameter: Variable;
  body: Expression;
}
export const Abstraction = {
  from(parameter: Variable, body: Expression): Abstraction {
    return { type: 'Abstraction', parameter, body };
  },
}
export type Application = {
  type: 'Application';
  operator: Expression;
  operand: Expression;
};
export const Application = {
  from(operator: Expression, operand: Expression): Application {
    return { type: 'Application', operator, operand };
  },
}
export type Ap = {
  type: 'Ap';
};
export const Ap = {
  from(): Ap {
    return { type: 'Ap' };
  },
}
export type Expression = Variable | Abstraction | Application;
export type Control = Expression | Ap;
export type Code = Control[];