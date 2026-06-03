import { RESERVED_TEAM_IDS } from './types';

/** WorldCupViewer teamId -> ISO 3166-1 alpha-2 (flag-icons code).
 *  Scotland/England use GB subdivision codes supported by flag-icons. */
export const TEAM_ISO: Record<number, string> = {
  1: 'mx', // Mexico
  2: 'za', // South Africa
  3: 'kr', // South Korea
  4: 'cz', // Czechia
  5: 'ca', // Canada
  6: 'ba', // Bosnia and Herzegovina
  7: 'qa', // Qatar
  8: 'ch', // Switzerland
  9: 'br', // Brazil
  10: 'ma', // Morocco
  11: 'ht', // Haiti
  12: 'gb-sct', // Scotland
  13: 'us', // USA
  14: 'py', // Paraguay
  15: 'au', // Australia
  16: 'tr', // Türkiye
  17: 'de', // Germany
  18: 'cw', // Curaçao
  19: 'ci', // Ivory Coast
  20: 'ec', // Ecuador
  21: 'nl', // Netherlands
  22: 'jp', // Japan
  23: 'se', // Sweden
  24: 'tn', // Tunisia
  25: 'be', // Belgium
  26: 'eg', // Egypt
  27: 'ir', // Iran
  28: 'nz', // New Zealand
  29: 'es', // Spain
  30: 'cv', // Cape Verde
  31: 'sa', // Saudi Arabia
  32: 'uy', // Uruguay
  33: 'fr', // France
  34: 'sn', // Senegal
  35: 'iq', // Iraq
  36: 'no', // Norway
  37: 'ar', // Argentina
  38: 'dz', // Algeria
  39: 'at', // Austria
  40: 'jo', // Jordan
  41: 'pt', // Portugal
  42: 'cd', // DR Congo
  43: 'uz', // Uzbekistan
  44: 'co', // Colombia
  45: 'gb-eng', // England
  46: 'hr', // Croatia
  47: 'gh', // Ghana
  48: 'pa', // Panama
};

export type SpecialOutcome = 'others' | 'draw';

/** Returns the flag-icons code for a teamId, or a special marker. */
export function flagFor(teamId: number): { iso: string } | { special: SpecialOutcome } {
  if (teamId === RESERVED_TEAM_IDS.others) return { special: 'others' };
  if (teamId === RESERVED_TEAM_IDS.draw) return { special: 'draw' };
  const iso = TEAM_ISO[teamId];
  return iso ? { iso } : { special: 'others' };
}
