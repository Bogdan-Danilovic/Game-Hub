import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Chakra_Petch } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthHeaderSlot } from '@/components/auth/AuthHeaderSlot';
import { GuestBanner } from '@/components/auth/GuestBanner';
import { UsernameSetup } from '@/components/auth/UsernameSetup';
import { HubNav } from '@/components/hub/HubNav';
import { PresenceTracker } from '@/components/presence/PresenceTracker';
import { Toaster } from 'sonner';
import { ReconnectOverlay } from '@/components/shared/ReconnectOverlay';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
});

const chakraPetch = Chakra_Petch({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'GameHub — Društvene igre u browseru',
  description: 'Tvoj hub za društvene igre. Impostor, Alias, Avalon i više!',
  metadataBase: new URL('https://impostor-web.vercel.app'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GameHub',
  },
  other: {
    'google-adsense-account': 'ca-pub-3801758630975994',
  },
};

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={cn('h-full antialiased', spaceGrotesk.variable, chakraPetch.variable, 'font-sans')}>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3801758630975994"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className="min-h-full flex flex-col font-sans selection:bg-violet-500/30"
        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        <header
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-14"
          style={{
            background: 'rgba(8,11,20,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span
            className="text-[18px] font-bold tracking-tight leading-none"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span style={{ color: '#8b5cf6' }}>GAME</span>
            <span style={{ color: '#fff' }}> HUB</span>
          </span>
          <div className="flex items-center gap-1">
            <HubNav />
            <AuthHeaderSlot />
          </div>
        </header>

        {children}
        <GuestBanner />
        <UsernameSetup />
        <PresenceTracker />
        <ReconnectOverlay />
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#0f1221',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#e2e8f0',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </body>
    </html>
  );
}
