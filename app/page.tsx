import { HubTabs } from '@/components/hub/HubTabs';
import { HubBottomNav } from '@/components/hub/HubBottomNav';
import { AdBanner } from '@/components/ads/AdBanner';

export default function HubPage() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden">
      {/* Background: soft radial accent orbs (constrained to the hub column) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mx-auto max-w-[480px] overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            top: -200,
            left: -100,
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: 300,
            right: -200,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(8,145,178,0.13) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Hub column — sits below the global header from layout.tsx */}
      <div className="relative z-10 mx-auto w-full max-w-[480px] px-5 pb-40 pt-24">
        <header className="mb-7">
          <p className="text-[13px] font-medium text-white/45">Tvoj hub za društvene igre</p>
        </header>

        <HubTabs />

        {/* Ad baner — ispod galerije, nikad tokom igre */}
        <div className="mt-8">
          {/* TODO: zameniti slot ID iz AdSense dashboarda */}
          <AdBanner slot="TODO_SLOT_HUB" format="horizontal" />
        </div>
      </div>

      {/* Bottom navigation (visual) */}
      <HubBottomNav />
    </main>
  );
}
