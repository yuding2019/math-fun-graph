/**
 * 处理表达式
 */
import emit from "./emit";
import { Operator, NumberReg, OperatorReg } from "./config";
import { calc } from './calcExpression';

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

function generatorExpNodes(exp: string[]): ExpNode[] {
  const nodes: ExpNode[] = [];

  let index = 0;
  let numStr = '';
  while (index < exp.length) {
    const char = exp[index];
    index++;
    if (NumberReg.test(char)) {
      numStr += char;
      continue;
    }

    if (char === 'x' || char === Operator.Left) {
      if (numStr) {
        nodes.push(
          expNode('number', numStr),
          expNode('operator', Operator.Multiply),
        );
        numStr = '';
      }

      nodes.push(expNode('var', char));
      continue;
    }

    if (OperatorReg.test(char)) {
      if (numStr) {
        nodes.push(expNode('number', numStr));
        numStr = '';
      }
      nodes.push(expNode('operator', char));
    }
  }
  if (numStr) {
    nodes.push(expNode('number', numStr));
  }
  return nodes;
}

function generatorExpNodeTree(exp: string[]): ExpNode {
  const nodes = generatorExpNodes(exp);
  if (nodes.length === 1) {
    return nodes[0];
  }

  const helper = (index: number) => {
    const root = nodes[index];
    const left = nodes[index - 1];
    const right = nodes[index + 1];

    root.left = left;
    root.right = right;
    // if (left.type === 'number' && right.type === 'number') {
    //   root.value = String(calc(root));
    //   root.type = 'number';
    //   root.left = null;
    //   root.right = null;
    // }
    nodes.splice(index - 1, 3, root);
    return root;
  }

  const visited: ExpNode[] = [];
  while (nodes.length !== 1) {
    let rootIndex = nodes.findIndex(node => {
      return (
        node.type === 'operator' &&
        [Operator.Multiply, Operator.Divide, Operator.Power].includes(node.value) &&
        !visited.includes(node)
      );
    });
    if (rootIndex > 0) {
      visited.push(helper(rootIndex));
      continue;
    }

    rootIndex = nodes.findIndex(node => {
      return (
        node.type === 'operator' &&
        [Operator.Plus, Operator.Minus].includes(node.value) &&
        !visited.includes(node)
      );
    });
    if (rootIndex > 0) {
      visited.push(helper(rootIndex));
    }
  }

  return nodes[0];
}

function process(exp: string) {
  const [_, right] = exp.split('=').map(s => s.trim());
  // TODO: 判断是否有函数体
  const expression: Expression = {
    raw: exp,
    body: right,
    node: generatorExpNodeTree(right.split('')),
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
