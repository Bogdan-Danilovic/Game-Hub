import type { Metadata } from 'next';
import { PreviewHub } from '@/components/preview/PreviewHub';

export const metadata: Metadata = {
  title: 'Game Hub — Redesign Preview',
  description: 'Pregled novog dizajna Game Hub platforme.',
  robots: { index: false, follow: false },
};

export default function PreviewPage() {
  return <PreviewHub />;
}
