export type CustomEventName = 'confirm:exp' | 'process:finish' | 'error';
export type Handler = (value: unknown) => void;

const EventPools: Partial<Record<CustomEventName, Handler[]>> = {};

function on(type: CustomEventName, handler: Handler) {
  const target = EventPools[type];
  if (typeof target === 'undefined') {
    EventPools[type] = [handler];
  } else {
    target.push(handler);
  }

  return function off() {
    const handlers = target?.slice() || [];
    for (let i = 0; i < handlers.length; i++) {
      if (handlers[i] === handler) {
        target?.splice(i, 1);
        return true;
      }
    }
    return false;
  }
}

function emit(type: CustomEventName, payload: unknown) {
  const handlers = EventPools[type];
  if (typeof handlers === 'undefined') return;

  handlers.slice().forEach(handler => handler(payload));
}

export default {
  on,
  emit,
};
