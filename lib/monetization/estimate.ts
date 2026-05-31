// eCPM tabela po Tier-u — placeholder dok ne stignu prvi AdSense izveštaji
// Tier 1: US/CA/GB/AU/DE... ~$3-8 eCPM
// Tier 2: RS/HR/PL/CZ...   ~$0.5-1.5 eCPM
// Tier 3: ostalo           ~$0.1-0.5 eCPM

const TIER1 = ['US', 'CA', 'GB', 'AU', 'DE', 'NL', 'SE', 'NO', 'DK', 'CH', 'FR', 'JP'];
const TIER2 = ['PL', 'CZ', 'RO', 'RS', 'HR', 'SI', 'SK', 'HU', 'BG', 'GR', 'PT', 'ES', 'IT'];

export type EcpmTier = 'tier1' | 'tier2' | 'tier3';

export function getEcpmTier(countryCode: string): EcpmTier {
  const cc = countryCode.toUpperCase();
  if (TIER1.includes(cc)) return 'tier1';
  if (TIER2.includes(cc)) return 'tier2';
  return 'tier3';
}

const ECPM: Record<EcpmTier, number> = { tier1: 5.0, tier2: 1.0, tier3: 0.3 };

export function estimateEarningUsd(videosWatched: number, tier: EcpmTier): number {
  return parseFloat(((ECPM[tier] / 1000) * videosWatched).toFixed(4));
}
