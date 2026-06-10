'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** true tek nakon hidratacije na klijentu — bez setState u efektu */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
