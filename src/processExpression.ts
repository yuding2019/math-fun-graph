/**
 * 处理表达式
 */
import emit from "./emit";
import { Operator, NumberReg, OperatorReg } from "./config";

export interface Expression {
  raw: string;
  body: string;
  node: ExpNode;
}
export type ExpType = 'number' | 'var' | 'operator' | 'root';
export interface ExpNode {
  type: ExpType;
  value: string;
  left: ExpNode | null;
  right: ExpNode | null;
}

function expNode(type: ExpType, value: string): ExpNode {
  return {
    type,
    value,
    left: null,
    right: null,
  };
}

function generatorExpNodeTree(exp: string[]): ExpNode {
  if (exp.length === 1 && !OperatorReg.test(exp[0])) {
    const value = exp[0];
    return expNode(value === 'x' ? 'var' : 'number', value);
  }

  const helper = (operator: string, left: string | ExpNode, right: string | ExpNode) => {
    const root = expNode('operator', operator);
    root.left = typeof left === 'object'
      ? left
      : expNode(NumberReg.test(left) ? 'number' : 'var', left);
    root.right = typeof right === 'object'
      ? right
      : expNode(NumberReg.test(right) ? 'number' : 'var', right);
    return root;
  }

  // 每次寻找操作符，优先寻找 乘 除 幂，然后寻找加 减
  // 取操作符两边的节点，然后调用`helper`构造一个ExpNode
  // 优先级高的运算操作在二叉树层级较高的地方，然后计算的时候，深度优先遍历进行计算，就完成运算符的优先级计算
  const nodes: (ExpNode | string)[] = [...exp];
  while (nodes.length !== 1) {
    let index = nodes.findIndex(node => typeof node === 'string' && [Operator.Multiply, Operator.Divide, Operator.Power].includes(node));
    if (index > 0) {
      nodes.splice(
        index - 1,
        3,
        helper(nodes[index] as string, nodes[index - 1], nodes[index + 1]),
      );
      continue;
    }

    index = nodes.findIndex(node => typeof node === 'string' && [Operator.Plus, Operator.Minus].includes(node));
    if (index > 0) {
      nodes.splice(
        index - 1,
        3,
        helper(nodes[index] as string, nodes[index - 1], nodes[index + 1]),
      );
    }
  }
  return nodes[0] as ExpNode;
}

function process(exp: string) {
  const [_, right] = exp.split('=').map(s => s.trim());

  const tokens: string[] = [];
  let numStr = '';
  for (const char of right) {
    if (NumberReg.test(char)) {
      numStr += char;
      continue;
    }

    if (char === Operator.X) {
      if (numStr) {
        tokens.push(numStr, Operator.Multiply);
        numStr = '';
      }
      tokens.push(char);
      continue;
    }

    if (OperatorReg.test(char)) {
      if (numStr) {
        tokens.push(numStr);
        numStr = '';
      }
      tokens.push(char);
    }
  }
  if (numStr) {
    tokens.push(numStr);
  }

  // TODO: 判断是否有函数体
  const expression: Expression = {
    raw: exp,
    body: right,
    node: generatorExpNodeTree(tokens),
  };
  console.log(expression);

  emit.emit('process:finish', expression);
}

export default function waitConfirm() {
  emit.on('confirm:exp', (exp) => {
    try {
      process(String(exp));
    } catch (e) {
      console.log(e);
    }
  });
}
