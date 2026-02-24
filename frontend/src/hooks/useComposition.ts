// Lightweight composition helpers for inputs/textareas (IME-friendly)
import * as React from "react";

type Handlers<T> = {
  onKeyDown?: (e: React.KeyboardEvent<T>) => void;
  onCompositionStart?: (e: React.CompositionEvent<T>) => void;
  onCompositionEnd?: (e: React.CompositionEvent<T>) => void;
};

export function useComposition<T extends HTMLElement>(handlers: Handlers<T>) {
  const composingRef = React.useRef(false);

  const handleCompositionStart = React.useCallback(
    (e: React.CompositionEvent<T>) => {
      composingRef.current = true;
      handlers.onCompositionStart?.(e);
    },
    [handlers.onCompositionStart]
  );

  const handleCompositionEnd = React.useCallback(
    (e: React.CompositionEvent<T>) => {
      composingRef.current = false;
      handlers.onCompositionEnd?.(e);
    },
    [handlers.onCompositionEnd]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<T>) => {
      // Ensure downstream consumers see the composing flag
      (e.nativeEvent as any).isComposing =
        (e.nativeEvent as any).isComposing || composingRef.current;
      handlers.onKeyDown?.(e);
    },
    [handlers.onKeyDown]
  );

  return {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
    isComposing: () => composingRef.current,
  };
}
