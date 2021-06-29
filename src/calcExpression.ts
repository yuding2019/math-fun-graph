import { Operator } from "./config";
import { ExpNode } from "./processExpression";

export function calc(op: string, left: string | number, right: string | number, x: number) {
  const leftValue = +Number(left === Operator.X ? x : left).toFixed(2);
  const rightValue = +Number(right === Operator.X ? x : right).toFixed(2);

  let res: number = 0;
  switch(op) {
    case Operator.Plus:
      res = leftValue + rightValue;
      break;
    case Operator.Minus:
      res = leftValue - rightValue;
      break;
    case Operator.Multiply:
      res = leftValue * rightValue;
      break;
    case Operator.Divide:
    case Operator.Divide2:
      res = leftValue / rightValue;
      break;
    case Operator.Power:
      res = leftValue ** rightValue;
      break;
    default:
      break;
  }

  return res;
}

export default function calcExpression(exp: ExpNode, x: number): number {
  const { left, right, value } = exp;
  
  if (!left || !right) return exp.type === 'number' ? Number(value) : x;

  if (left.type !== 'operator' && right.type !== 'operator') {
    return calc(value, left.value, right.value, x);
  }
  
  return calc(exp.value, calcExpression(left, x), calcExpression(right, x), x);
}
