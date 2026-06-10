'use client';

import { useState } from 'react';

/**
 * Ime igraca koje se automatski popuni iz auth profila cim se ucita,
 * ali samo dok korisnik nije nista ukucao. Koristi adjust-during-render
 * umesto setState u efektu (react.dev "You Might Not Need an Effect").
 */
export function usePrefilledName(displayName: string | null | undefined) {
  const [name, setName] = useState(displayName ?? '');
  const [prevDisplayName, setPrevDisplayName] = useState(displayName);

  if (displayName !== prevDisplayName) {
    setPrevDisplayName(displayName);
    if (displayName && name === '') setName(displayName);
  }

  return [name, setName] as const;
}
