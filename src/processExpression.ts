/**
 * 处理表达式
 */
import emit from "./emit";
import { Operator, NumberReg, OperatorReg, ExpTypeEnum, ExpType } from "./config";

export interface Expression {
  raw: string;
  body: string;
  node: ExpNode;
}
export interface ExpNode {
  type: ExpType;
  value: string;
  left: ExpNode | null;
  right: ExpNode | null;
}

// 构建节点对象
function createNewExpNode(type: ExpType, value: string): ExpNode {
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
    return createNewExpNode(value === 'x' ? ExpTypeEnum.VAR : ExpTypeEnum.NUMBER, value);
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

    const root = createNewExpNode(ExpTypeEnum.OPERATOR, operator);

    root.right = typeof right === 'object'
      ? right
      : createNewExpNode(NumberReg.test(right) ? ExpTypeEnum.NUMBER : ExpTypeEnum.VAR, right);
    // 根号特殊处理
    if (operator === Operator.Sqrt) {
      nodes.splice(index, 2, root);
      return root;
    }

    root.left = typeof left === 'object'
      ? left
      : createNewExpNode(NumberReg.test(left) ? ExpTypeEnum.NUMBER : ExpTypeEnum.VAR, left);    
    nodes.splice(index - 1, 3, root);
    return root;
  }

  // 每次寻找操作符，优先寻找幂 开方，然后 乘 除，最后 加 减
  // 取操作符两边的节点，然后调用`helper`构造一个ExpNode
  // 优先级高的运算操作在二叉树层级较高的地方，然后计算的时候，深度优先遍历进行计算，就完成运算符的优先级计算
  while (nodes.length !== 1) {
    let index = nodes.findIndex(node => {
      return typeof node === 'string' && [Operator.Power, Operator.Sqrt].includes(node);
    });
    if (index >= 0) {
      helper(index);
      continue;
    }

    index = nodes.findIndex(node => {
      return typeof node === 'string' && [Operator.Multiply, Operator.Divide, Operator.Divide2].includes(node);
    });
    if (index > 0) {
      helper(index);
      continue;
    }

    index = nodes.findIndex(node => {
      return typeof node === 'string' && [Operator.Plus, Operator.Minus].includes(node);
    });
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
  const brackets: string[] = [];
  for (let i = 0; i < right.length; i++) {
    const current = right[i];
    if (current === ' ') continue;

    // 判断 `-x`
    if (i === 0 && current === Operator.Minus) {
      const next = right[i + 1];
      if ([Operator.X, Operator.Sqrt].includes(next)) {
        tokens.push('-1', Operator.Multiply);
      } else if (NumberReg.test(next)) {
        numStr += current;
      }
      continue;
    }

    // 负数在第一位
    if (
      (i === 0 && NumberReg.test(right[i + 1])) ||
      current === Operator.Dot ||
      NumberReg.test(current)
    ) {
      numStr += current;
      continue;
    }

    if ([Operator.X, Operator.Left].includes(current)) {
      if (numStr) {
        tokens.push(numStr, Operator.Multiply);
        numStr = '';
      }
      tokens.push(current);

      if (current === Operator.Left) {
        brackets.push(Operator.Right);
      }
      continue;
    }

    if (OperatorReg.test(current)) {
      if (numStr) {
        tokens.push(numStr);
        numStr = '';
      }
      tokens.push(current);

      if (current === Operator.Right) {
        brackets.pop();
      }
    }
  }
  if (numStr) {
    tokens.push(numStr);
  }

  if (brackets.length) {
    throw new Error('括号匹配不上了，检查一下表达式吧');
  }

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
      emit.emit('error', e);
    }
  });
}
