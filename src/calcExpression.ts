import { Operator, ExpTypeEnum } from "./config";
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
    case Operator.Sqrt:
      res = Math.sqrt(rightValue);
      break;
    default:
      break;
  }

  return res;
}

export default function calcExpression(expNode: ExpNode, x: number): number {
  const {
    left,
    right,
    value,
    type,
  } = expNode;

  if (!left && right && value === Operator.Sqrt) {
    return right.type === ExpTypeEnum.OPERATOR
      ? calc(value, 0, calcExpression(right, x), x)
      : calc(value, 0, right.value, x);
  }
  
  // 类似 y=1 y=x
  if (!left || !right) return type === 'number' ? Number(value) : x;

  if (
    left.type !== ExpTypeEnum.OPERATOR &&
    right.type !== ExpTypeEnum.OPERATOR
  ) {
    return calc(value, left.value, right.value, x);
  }
  
  return calc(
    expNode.value,
    calcExpression(left, x),
    calcExpression(right, x),
    x,
  );
}
