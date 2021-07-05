import emit from "./emit"

export function createError(cond: boolean, msg: string) {
  if (cond) {
    throw new Error(msg);
  }
}

// TODO 完成一个错误提示弹窗

export default function handleError() {
  emit.on('error', (error) => {
    const { message } = error as Error;

    alert(message);
  })
}