export type RemoveFun = () => void;

export function addEventListener(
  target: HTMLElement,
  type: keyof HTMLElementEventMap,
  handler: (e: Event) => void
): RemoveFun {
  target.addEventListener(type, handler);

  return () => {
    target.removeEventListener(type, handler);
  }
}
