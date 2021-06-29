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

export type OperatorType = typeof Operator;
export type OperatorKey = keyof OperatorType;
