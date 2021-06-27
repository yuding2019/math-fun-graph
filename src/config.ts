export const Operator = {
  Y: 'y',
  Equal: '=',
  X: 'x',
  Plus: '+',
  Minus: '-',
  Multiply: '×',
  Divide: '÷',
  Power: '^',
  Sqrt: '√',
  Left: '(',
  Right: ')',
};

export const NumberReg = /[0-9]/;
export const OperatorReg = /[\+\-\×\÷\^\√\(\)]/;

export const OperatorMap = (function generatorMap() {
  const map = new Map<string, OperatorKey>();
  Object.keys(Operator).forEach(key => {
    map.set(Operator[key as OperatorKey], key as OperatorKey);
  });
  return map;
})();

export type OperatorType = typeof Operator;
export type OperatorKey = keyof OperatorType;
