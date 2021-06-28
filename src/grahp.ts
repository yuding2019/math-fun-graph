import calcExpression from "./calcExpression";
import emit from "./emit";
import { Expression } from "./processExpression";

interface Ref<T> { current: T; }
interface Graph {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

const Width = 900;
const Height = 800;
const GridColor = '#ddd';
const offset = 0.5;

let baseMarkWidth = 40;
const GraphRef: Ref<Graph | null> = { current: null };
const CacheRef: Ref<Graph | null> = { current: null };

function grahp(cache?: boolean): Graph {
  const ratio = window.devicePixelRatio;
  const canvas = cache
    ? document.createElement('canvas')
    : document.getElementById('graph')! as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  canvas.style.width = `${Width}px`;
  canvas.style.height = `${Height}px`;
  canvas.width = ~~(Width * ratio);
  canvas.height = ~~(Height * ratio);
  ctx.scale(ratio, ratio);

  return {
    canvas,
    ctx,
  };
}

function drawAxis() {
  if (GraphRef.current === null) {
    GraphRef.current = grahp();
  }

  const { ctx } = GraphRef.current;

  ctx.save();
  ctx.translate(Width / 2, Height / 2);
  ctx.lineWidth = 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#333';
  ctx.font = '14px serif';

  const xAxisCount = ~~(Width / baseMarkWidth / 2) + 2;
  const yAxisCount = ~~(Height / baseMarkWidth / 2) + 2;
  const xAxisIt = axisIterator(1, xAxisCount, 'x');
  const yAxisIt = axisIterator(1, yAxisCount, 'y');

  let currentX = 0;
  let currentY = 0;
  let timer: number | null = null;
  const frame = () => {
    const { value: xAxisValue, done: xAxisDone } = xAxisIt.next();
    const { value: yAxisValue, done: yAxisDone } = yAxisIt.next();

    if (xAxisValue) {
      const { x, label } = xAxisValue;

      // 绘制网格
      drawGrid(ctx, x + offset, - Height / 2, x + offset, Height / 2);

      ctx.beginPath();
      ctx.moveTo(currentX + offset, offset);
      ctx.lineTo(x + offset, offset);
      ctx.lineTo(x + offset, -5 + offset);
      ctx.moveTo(currentX + offset, offset);
      ctx.lineTo(-(x + offset), offset);
      ctx.lineTo(-(x + offset), -5 + offset);

      ctx.fillText(String(label), x, 14);
      ctx.fillText(String(-label), -x, 14);

      currentX = x;
    }

    if (yAxisValue) {
      const { y, label } = yAxisValue;

      drawGrid(ctx, -Width / 2, y + offset, Width / 2, y + offset);

      ctx.beginPath();
      ctx.moveTo(offset, currentY + offset);
      ctx.lineTo(offset, y + offset);
      ctx.lineTo(5 + offset, y + offset);
      ctx.moveTo(offset, currentY + offset);
      ctx.lineTo(offset, -(y + offset));
      ctx.lineTo(5 + offset, -(y + offset));

      ctx.fillText(String(-label), -10, y);
      ctx.fillText(String(label), -8, -y);
  
      currentY = y;
    }
    ctx.stroke();
    
    if (xAxisDone && yAxisDone) {
      timer && cancelAnimationFrame(timer);
      timer = null;
      ctx.restore();
      return;
    }
    timer = requestAnimationFrame(frame);
  }
  frame();
}

// 绘制网格
function drawGrid(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const xOperator = x1 === x2 ? '-' : '';
  const yOperator = y1 === y2 ? '-' : '';

  ctx.save();
  ctx.strokeStyle = GridColor;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.moveTo(+`${xOperator}${x1}`, +`${yOperator}${y1}`);
  ctx.lineTo(+`${xOperator}${x2}`, +`${yOperator}${y2}`);
  ctx.stroke();
  ctx.restore();
}

function *axisIterator(start: number, end: number, change: 'x' | 'y') {
  let index = start;
  while (index < end) {
    const pos = {
      x: 0,
      y: 0,
      label: index,
      [change]: index * baseMarkWidth,
    };
    index++;
    yield pos;
  }
}

function drawMathFunGraph() {
  if (CacheRef.current === null) {
    CacheRef.current = grahp(true);
    CacheRef.current.ctx.drawImage(GraphRef.current!.canvas, 0, 0, Width, Height);
  }

  const { ctx } = GraphRef.current!;
  ctx.clearRect(0, 0, Width, Height);
  ctx.drawImage(CacheRef.current.canvas, 0, 0, Width, Height);

  return (...points: [number, number][][]) => {
    const [points1, points2] = points;

    let [[currentX, currentY], ...rest] = points1;
    console.log(points);
    ctx.save();
    ctx.translate(Width / 2, Height / 2);
    ctx.strokeStyle = '#1B9CFC';
    ctx.lineWidth = 2;
    ctx.beginPath();

    ctx.moveTo(currentX, -currentY);
    rest.forEach(([x, y]) => {
      ctx.lineTo(x, -y);
    });

    if (points2.length) {
      [[currentX, currentY], ...rest] = points2;
      ctx.moveTo(currentX, -currentY);
      rest.forEach(([x, y]) => {
        ctx.lineTo(x, -y);
      });
    }

    ctx.stroke();
    ctx.restore();
  };
};

export default function waitProcess() {
  drawAxis();

  emit.on('process:finish', (exp) => {
    const _draw = drawMathFunGraph();
    const expNode = (exp as Expression).node;

    // 是否可以取0
    const canBe0 = Number.isFinite(calcExpression(expNode, 0));
    const value1 = calcExpression(expNode, 1);
    const value2 = calcExpression(expNode, -1);
    // y轴对称
    const bilateralY = value1 === value2;
    // 原点对称
    const bilateralO = !bilateralY && Math.abs(value1) === Math.abs(value2);

    let timer: number | null = null;
    let x1 = canBe0 ? 0 : 0.1; // x轴正方向
    let x2 = canBe0 ? 0 : 0.1; // x轴负方向
    const map = () => {
      // 这里计算的坐标是标准坐标
      const points1: [number, number][] = [];
      const points2: [number, number][] = [];

      let _x1 = 0;
      let _y1 = 0;
      let _x2 = 0;
      let _y2 = 0;
      for (let i = 0; i < 10; i++) {
        _x1 = Number((x1 * baseMarkWidth).toFixed(2));
        _y1 = Number((calcExpression(expNode, x1) * baseMarkWidth).toFixed(2));
        points1.push([_x1, _y1]);
        // 对称的话，只需要计算一次
        if (bilateralY || bilateralO) {
          bilateralY ? points2.push([-_x1, _y1]) : points2.push([-_x1, -_y1]);
        } else {
          _x2 = Number((x2 * baseMarkWidth).toFixed(2));
          _y2 = Number((calcExpression(expNode, x2) * baseMarkWidth).toFixed(2));
          points2.push([_x2, _y2]);
        }

        if (x1 > 12 || _y1 > Height / 2 || _y2 < -Height / 2) {
          _draw(points1, points2);
          timer && cancelAnimationFrame(timer);
          timer = null;
          return;
        }
        x1 += 0.1;
        x2 -= 0.1;
      }
      x1 -= 0.1;
      x2 += 0.1;

      _draw(points1, points2);
      requestAnimationFrame(map);
    }
    map();
  });
}