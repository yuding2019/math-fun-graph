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

  return (points: [number, number][]) => {
    const [[currentX, currentY], ...rest] = points;
    ctx.save();
    ctx.translate(Width / 2, Height / 2);
    ctx.strokeStyle = '#1B9CFC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentX, -currentY);
    rest.forEach(([x, y]) => {
      ctx.lineTo(x, -y);
    });
    ctx.moveTo(-currentX, -currentY);
    rest.forEach(([x, y]) => {
      ctx.lineTo(-x, -y);
    });
    ctx.stroke();
    ctx.restore();
  };
};

export default function waitProcess() {
  drawAxis();

  emit.on('process:finish', (exp) => {
    // const it = calcIterator(exp as Expression, 0, 20);
    const _draw = drawMathFunGraph();

    let timer: number | null = null;
    let x = 0.1;
    const map = () => {
      x -= 0.1;

      const points: [number, number][] = [];
      for (let i = 0; i <= 10; i++) {
        const _x = +Number((x * baseMarkWidth).toFixed(2));
        const _y = +Number((+calcExpression((exp as Expression).node, x) * baseMarkWidth).toFixed(2))        
        points.push([_x, _y]);

        if (x > 12 || _y > Height / 2) {
          _draw(points);
          timer && cancelAnimationFrame(timer);
          timer = null;
          return;
        }
        x += 0.1;
      }
      console.log(points);
      _draw(points);
      requestAnimationFrame(map);
    }
    map();
  });
}