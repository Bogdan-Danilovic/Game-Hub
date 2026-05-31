'use client';

import { useEffect, useRef } from 'react';

type Props = {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
};

// TODO: Kreirati ad unit u AdSense dashboard-u i uneti slot ID
export function AdBanner({ slot, format = 'auto', className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      (
        (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle =
          (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || []
      ).push({});
    } catch {
      // adsbygoogle nije učitan
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`w-full overflow-hidden ${className}`}
      style={{ minHeight: format === 'horizontal' ? 90 : 250 }}
      aria-hidden="true"
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-3801758630975994"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
