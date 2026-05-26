import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'GameHub — Društvene igre u browseru',
  description: 'Tvoj hub za društvene igre. Impostor, Alias, Trivia i više!',
  metadataBase: new URL('https://impostor-web.vercel.app'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GameHub',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr" className={cn("h-full", "antialiased", spaceGrotesk.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col bg-slate-800 text-slate-100 font-sans selection:bg-violet-500/30">
        {children}
      </body>
    </html>
  );
}
