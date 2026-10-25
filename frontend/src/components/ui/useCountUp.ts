import { useState, useEffect } from 'react';

/**
 * Hook to count up from 0 to a static numeric target over duration (default 600ms).
 * Strictly for STATIC stat numbers only (never live or server values).
 * Bypasses animation immediately if prefers-reduced-motion is active.
 */
export function useCountUp(target: number, duration: number = 600): number {
  const [count, setCount] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return target;
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }

    let startTime: number | null = null;
    let animFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Linear or subtle easeOutQuad
      const current = Math.floor(progress * target);
      setCount(current);

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [target, duration]);

  return count;
}
