import React, { useEffect, useState } from 'react';

export interface CountUpNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

/**
 * Purposeful count-up micro-interaction component for loaded numeric metrics.
 * Respects prefers-reduced-motion to instantly display the target number without animation.
 */
export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  durationMs = 600,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(() => {
    // If reduced motion is requested, show final value immediately
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return value;
    }
    return 0;
  });

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplayValue(value);
      return;
    }

    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = performance.now();
    const startValue = 0;
    const endValue = value;

    let animationFrameId: number;

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, durationMs]);

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span className={`text-mono tabular-nums ${className}`.trim()}>
      {prefix}{formatted}{suffix}
    </span>
  );
};
