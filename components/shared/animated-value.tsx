'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type AnimatedValueProps = {
  value: number;
  kind?: 'currency' | 'percent' | 'number';
  locale?: string;
  currency?: string;
  durationMs?: number;
  className?: string;
  positivePrefix?: boolean;
};

export function AnimatedValue({
  value,
  kind = 'number',
  locale = 'es-ES',
  currency = 'EUR',
  durationMs = 640,
  className,
  positivePrefix = false
}: AnimatedValueProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const targetValue = value;
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (targetValue - startValue) * eased;

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        previousValueRef.current = targetValue;
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [durationMs, value]);

  const formatted = useMemo(() => {
    const formatter =
      kind === 'currency'
        ? new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          })
        : kind === 'percent'
          ? new Intl.NumberFormat(locale, {
              style: 'percent',
              minimumFractionDigits: 0,
              maximumFractionDigits: 1
            })
          : new Intl.NumberFormat(locale, {
              maximumFractionDigits: 2
            });

    const output = formatter.format(displayValue);

    if (positivePrefix && value > 0 && kind !== 'percent') {
      return `+${output}`;
    }

    return output;
  }, [currency, displayValue, kind, locale, positivePrefix, value]);

  return <span className={className}>{formatted}</span>;
}
