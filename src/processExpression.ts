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
export type ExpType = 'number' | 'var' | 'operator';
export interface ExpNode {
  type: ExpType;
  value: string;
  left: ExpNode | null;
  right: ExpNode | null;
}

// 构建节点对象
function expNode(type: ExpType, value: string): ExpNode {
  return {
    type,
    value,
    left: null,
    right: null,
  };
}

// 根据解析的token构建二叉树
function generatorExpNodeTree(tokens: string[]): ExpNode {
  if (tokens.length === 1) {
    const value = tokens[0];
    return expNode(value === 'x' ? 'var' : 'number', value);
  }
  
  const nodes: (ExpNode | string)[] = [...tokens];

  // 判断括号，有括号就递归调用一次
  if (tokens.includes(Operator.Left)) {
    const start = tokens.indexOf(Operator.Left);
    const end = tokens.lastIndexOf(Operator.Right);
    nodes.splice(
      start,
      end - start + 1,
      generatorExpNodeTree(tokens.slice(start + 1, end)),
    );
  }

  const helper = (index: number) => {
    const operator = nodes[index] as string;
    const left = nodes[index - 1];
    const right = nodes[index + 1];

    const root = expNode('operator', operator);
    root.left = typeof left === 'object'
      ? left
      : expNode(NumberReg.test(left) ? 'number' : 'var', left);
    root.right = typeof right === 'object'
      ? right
      : expNode(NumberReg.test(right) ? 'number' : 'var', right);
    
    nodes.splice(index - 1, 3, root);
    return root;
  }

  // 每次寻找操作符，优先寻找幂，然后 乘 除，最后 加 减
  // 取操作符两边的节点，然后调用`helper`构造一个ExpNode
  // 优先级高的运算操作在二叉树层级较高的地方，然后计算的时候，深度优先遍历进行计算，就完成运算符的优先级计算
  while (nodes.length !== 1) {
    let index = nodes.findIndex(node => typeof node === 'string' && [Operator.Power].includes(node));
    if (index > 0) {
      helper(index);
      continue;
    }

    index = nodes.findIndex(node => typeof node === 'string' && [Operator.Multiply, Operator.Divide, Operator.Divide2].includes(node));
    if (index > 0) {
      helper(index);
      continue;
    }

    index = nodes.findIndex(node => typeof node === 'string' && [Operator.Plus, Operator.Minus].includes(node));
    if (index > 0) {
      helper(index);
    }
  }
  return nodes[0] as ExpNode;
}

function process(exp: string) {
  const [_, right, ...rest] = exp.split('=').map(s => s.trim());

  if (!right) {
    throw new Error('表达式是不是没写函数体呀');
  }

  if (rest.length) {
    throw new Error('表达式是不是多了几个等号呀');
  }

  let numStr = '';
  const tokens: string[] = [];
  for (let i = 0; i < right.length; i++) {
    const char = right[i];
    if (char === ' ') continue;

    // 判断 `-x`
    if (i === 0 && char === Operator.Minus) {
      const next = right[i + 1];
      if (next === Operator.X) {
        tokens.push('-1', Operator.Multiply);
      } else if (NumberReg.test(next)) {
        numStr += char;
      }
      continue;
    }

    // 负数在第一位
    if (
      (i === 0 && NumberReg.test(right[i + 1])) ||
      char === Operator.Dot ||
      NumberReg.test(char)
    ) {
      numStr += char;
      continue;
    }

    if ([Operator.X, Operator.Left].includes(char)) {
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
  debugger;
  if (!tokens.length || (tokens.length === 1 && tokens[0] !== Operator.X && Number.isNaN(+tokens[0]))) {
    throw new Error('函数是不是写错了呀，我怎么解析不了了');
  }

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
