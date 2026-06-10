'use client';

import { useSyncExternalStore } from 'react';

interface PlayerIdentity {
  id: string | null;
  name: string | null;
}

// localStorage se ne menja spolja tokom sesije — dovoljan je no-op subscribe
const subscribe = () => () => {};

export function usePlayer(): PlayerIdentity {
  const id = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem('playerId'),
    () => null
  );
  const name = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem('playerName'),
    () => null
  );

  return { id, name };
}
