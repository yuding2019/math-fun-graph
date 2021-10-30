export const Operator = {
  Y: 'y',
  Equal: '=',
  X: 'x',
  Plus: '+',
  Minus: '-',
  Multiply: '×',
  Divide: '÷',
  Divide2: '/',
  Power: '^',
  Sqrt: '√',
  Left: '(',
  Right: ')',
  Dot: '.',
};

export const NumberReg = /\-?[0-9]+/;
export const OperatorReg = /[\+\-\×\÷\^\√\(\)\/]/;

export const ExpTypeEnum = {
  VAR: 'var',
  NUMBER: 'number',
  OPERATOR: 'operator',
} as const;

export type ExpType = typeof ExpTypeEnum[keyof typeof ExpTypeEnum];

export type OperatorType = typeof Operator;
export type OperatorKey = keyof OperatorType;
