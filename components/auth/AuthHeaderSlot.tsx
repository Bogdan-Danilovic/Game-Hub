'use client';

import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from './UserAvatar';
import { GoogleSignInButton } from './GoogleSignInButton';

export function AuthHeaderSlot() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <UserAvatar size={32} />;
  }

  return <GoogleSignInButton className="!min-w-0 !px-3 !py-2 !text-xs" />;
}
