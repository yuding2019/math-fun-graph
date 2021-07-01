import emit from "./emit"

// TODO 完成一个错误提示弹窗

export default function handleError() {
  emit.on('error', (error) => {
    const { message } = error as Error;

    alert(message);
  })
}