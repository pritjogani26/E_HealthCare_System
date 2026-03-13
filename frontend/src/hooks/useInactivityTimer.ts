// frontend\src\hooks\useInactivityTimer.ts
import { useEffect, useRef, useCallback } from "react";

export const INACTIVITY_TIMEOUT_MS = 150 * 60 * 1000;
// export const INACTIVITY_TIMEOUT_MS = 10 * 1000;

const ACTIVITY_EVENT: ReadonlyArray<string> = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "touchmove",
  "scroll",
  "click",
  "wheel",
  "focus",
];

export interface useInactivityTimerOptions {
  onTimeout: () => void;
  enabled: boolean;
}

export function useInactivityTimer({
  onTimeout,
  enabled,
}: useInactivityTimerOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(onTimeout, INACTIVITY_TIMEOUT_MS);
  }, [onTimeout, clearTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }
    resetTimer();

    ACTIVITY_EVENT.forEach((evt) => 
        window.addEventListener(evt, resetTimer, {passive: true})
    );

    return () => {
        clearTimer();
        ACTIVITY_EVENT.forEach((evt) => 
            window.removeEventListener(evt, resetTimer)
        );
    };

  }, [enabled, resetTimer, clearTimer]);
}
