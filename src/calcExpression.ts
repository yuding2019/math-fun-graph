import { Operator } from "./config";
import { ExpNode } from "./processExpression";

export function calc(op: string, left: string, right: string, x?: number) {
  const leftValue = +Number(left === 'x' ? x : left).toFixed(2);
  const rightValue = +Number(right === 'x' ? x : right).toFixed(2);

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
      res = leftValue / rightValue;
      break;
    case Operator.Power:
      res = leftValue ** rightValue;
      break;
    default:
      break;
  }

  return Number.isFinite(res) ? String(res) : '0';
}

export default function calcExpression(exp: ExpNode, x: number): string {
  if (!exp.left || !exp.right) return String(exp.type === 'number' ? exp.value : x);
  if (['number', 'var'].includes(exp.left.type) && ['number', 'var'].includes(exp.right.type)) {
    return calc(exp.value, exp.left.value, exp.right.value, x);
  }
  
  const { left, right } = exp;
  // debugger;
  return calc(exp.value, calcExpression(left, x), calcExpression(right, x), x);
}
