'use client';

import { useEffect, useRef } from 'react';

type Props = {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
};

// Placeholder slotovi (npr. "TODO_SLOT_HUB") ne smeju da šalju prave ad zahteve —
// AdSense ih odbija sa HTTP 400 i pune konzolu. Dok se ne kreira pravi ad unit u
// AdSense dashboard-u i unese slot ID, banner ostaje tih (ne push-uje adsbygoogle).
function isPlaceholderSlot(slot: string): boolean {
  return !slot || slot.startsWith('TODO');
}

export function AdBanner({ slot, format = 'auto', className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const placeholder = isPlaceholderSlot(slot);

  useEffect(() => {
    if (placeholder || !ref.current) return;
    try {
      (
        (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle =
          (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || []
      ).push({});
    } catch {
      // adsbygoogle nije učitan
    }
  }, [placeholder]);

  // Rezerviši isti prostor (bez CLS) ali bez ad zahteva dok je slot placeholder.
  if (placeholder) {
    return (
      <div
        className={`w-full overflow-hidden ${className}`}
        style={{ minHeight: format === 'horizontal' ? 90 : 250 }}
        aria-hidden="true"
      />
    );
  }

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
