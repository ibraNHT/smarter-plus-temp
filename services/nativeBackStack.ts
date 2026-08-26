type BackHandler = () => boolean;

const stack: BackHandler[] = [];

/** Register a handler that returns true when it consumed the Android back press. */
export function registerNativeBackHandler(handler: BackHandler): () => void {
  stack.push(handler);
  return () => {
    const idx = stack.lastIndexOf(handler);
    if (idx >= 0) stack.splice(idx, 1);
  };
}

export function consumeNativeBack(): boolean {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    try {
      if (stack[i]()) return true;
    } catch {
      /* continue */
    }
  }
  return false;
}
