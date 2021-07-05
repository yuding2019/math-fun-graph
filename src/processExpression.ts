/**
 * 处理表达式
 */
import emit from "./emit";
import { createError } from './handleError';
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

const checkNodeType = (node: ExpNode | string) => {
  if (typeof node === 'object') return node;
  return expNode(NumberReg.test(node) ? 'number' : 'var', node);
}
const findOperatorIndex = (nodes: (ExpNode | string)[], targetOps: string[]) => {
  return nodes.findIndex(node => typeof node === 'string' && targetOps.includes(node));
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
    root.right = checkNodeType(right);
    // 根号特殊处理
    if (operator === Operator.Sqrt) {
      nodes.splice(index, 2, root);
      return root;
    }

    root.left = checkNodeType(left);    
    nodes.splice(index - 1, 3, root);
    return root;
  }

  // 每次寻找操作符，优先寻找幂 开方，然后 乘 除，最后 加 减
  // 取操作符两边的节点，然后调用`helper`构造一个ExpNode
  // 优先级高的运算操作在二叉树层级较高的地方，然后计算的时候，深度优先遍历进行计算，就完成运算符的优先级计算
  while (nodes.length !== 1) {
    let index = findOperatorIndex(nodes, [Operator.Power, Operator.Sqrt]);
    if (index >= 0) {
      helper(index);
      continue;
    }

    index = findOperatorIndex(nodes, [Operator.Multiply, Operator.Divide, Operator.Divide2]);
    if (index > 0) {
      helper(index);
      continue;
    }

    index = findOperatorIndex(nodes, [Operator.Plus, Operator.Minus]);
    if (index > 0) {
      helper(index);
    }
  }
  return nodes[0] as ExpNode;
}

const checkMinusX = (str: string, index: number) => index === 0 && str[index] === Operator.Minus;
const checkNumber = (str: string, index: number) => {
  if (index === 0) return NumberReg.test(str[index + 1]);
  return str[index] === Operator.Dot || NumberReg.test(str[index]);
};
// 处理表达式
function process(exp: string) {
  const [_, right, ...rest] = exp.split('=').map(s => s.trim());

  createError(!right, '表达式是不是没写函数体呀');
  createError(!!rest.length, '表达式是不是多了几个等号呀');

  let numStr = '';
  const tokens: string[] = [];
  const brackets: string[] = [];
  for (let i = 0; i < right.length; i++) {
    const char = right[i];
    if (char === ' ') continue;

    // 判断 `-x`
    if (checkMinusX(right, i)) {
      const next = right[i + 1];
      if ([Operator.X, Operator.Sqrt].includes(next)) {
        tokens.push('-1', Operator.Multiply);
      } else if (NumberReg.test(next)) {
        numStr += char;
      }
      continue;
    }

    // 负数在第一位
    if (checkNumber(right, i)) {
      numStr += char;
      continue;
    }

    if ([Operator.X, Operator.Left].includes(char)) {
      if (numStr) {
        tokens.push(numStr, Operator.Multiply);
        numStr = '';
      }
      tokens.push(char);

      if (char === Operator.Left) {
        brackets.push(Operator.Right);
      }
      continue;
    }

    if (OperatorReg.test(char)) {
      if (numStr) {
        tokens.push(numStr);
        numStr = '';
      }
      tokens.push(char);

      if (char === Operator.Right) {
        brackets.pop();
      }
    }
  }
  if (numStr) {
    tokens.push(numStr);
  }

  createError(!!brackets.length, '括号匹配不上了，检查一下表达式吧');
  createError(
    !tokens.length || (tokens[0] !== Operator.X && Number.isNaN(+tokens[0])),
    '函数是不是写错了呀，我怎么解析不了了',
  );

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
      emit.emit('error', e);
    }
  });
}
