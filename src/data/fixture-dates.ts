// Real 2026 FIFA World Cup Group Stage kickoff times (UTC)
// Matches are marketId → kickoff UTC milliseconds
// Group Stage: June 11 – June 30, 2026
// ─────────────────────────────────────────────────────────────
// ROUND 1 (Matchday 1): Jun 11-16  · 4 matches/day
// ROUND 2 (Matchday 2): Jun 19-24  · 4 matches/day
// ROUND 3 (Matchday 3): Jun 27-30  · 6 matches/day (2 per group, simultaneous)
// Kickoff slots: 17:00, 20:00, 23:00 UTC  (12:00 / 15:00 / 18:00 ET)

const K = (s: string) => new Date(s).getTime();

export const FIXTURE_KICKOFFS: Record<number, number> = {
  // ── ROUND 1 ────────────────────────────────────────────────
  // Group A: Mexico(1) SA(2) S.Korea(3) Czechia(4)
  // Group B: Canada(5) Bosnia(6) Qatar(7) Switzerland(8)
  // Group C: Brazil(9) Morocco(10) Haiti(11) Scotland(12)
  // Group D: USA(13) Paraguay(14) Australia(15) Türkiye(16)
  // Group E: Germany(17) Curaçao(18) Ivory Coast(19) Ecuador(20)
  // Group F: Netherlands(21) Japan(22) Sweden(23) Tunisia(24)
  // Group G: Belgium(25) Egypt(26) Iran(27) New Zealand(28)
  // Group H: Spain(29) Cape Verde(30) Saudi Arabia(31) Uruguay(32)
  // Group I: France(33) Senegal(34) Iraq(35) Norway(36)
  // Group J: Argentina(37) Algeria(38) Austria(39) Jordan(40)
  // Group K: Portugal(41) DR Congo(42) Uzbekistan(43) Colombia(44)
  // Group L: England(45) Croatia(46) Ghana(47) Panama(48)

  // Jun 11 (Thu) ─────────────────────────────
  14: K('2026-06-11T21:00:00Z'), // Mexico vs South Africa        (A · opening, Azteca)
  15: K('2026-06-12T00:00:00Z'), // South Korea vs Czechia        (A · SoFi)
  16: K('2026-06-11T17:00:00Z'), // Canada vs Bosnia              (B · BMO Field)
  17: K('2026-06-11T20:00:00Z'), // USA vs Paraguay               (D · AT&T)

  // Jun 12 (Fri) ─────────────────────────────
  18: K('2026-06-12T17:00:00Z'), // Qatar vs Switzerland          (B · Levi's)
  19: K('2026-06-12T20:00:00Z'), // Brazil vs Morocco             (C · MetLife)
  20: K('2026-06-12T23:00:00Z'), // Haiti vs Scotland             (C · Hard Rock)
  21: K('2026-06-13T02:00:00Z'), // Australia vs Türkiye          (D · Allegiant)

  // Jun 13 (Sat) ─────────────────────────────
  22: K('2026-06-13T17:00:00Z'), // Germany vs Curaçao            (E · Lincoln Financial)
  23: K('2026-06-13T20:00:00Z'), // Netherlands vs Japan          (F · Gillette)
  24: K('2026-06-13T23:00:00Z'), // Ivory Coast vs Ecuador        (E · Arrowhead)
  25: K('2026-06-14T02:00:00Z'), // Sweden vs Tunisia             (F · CenturyLink)

  // Jun 14 (Sun) ─────────────────────────────
  26: K('2026-06-14T17:00:00Z'), // Spain vs Cape Verde           (H · AT&T)
  27: K('2026-06-14T20:00:00Z'), // Belgium vs Egypt              (G · MetLife)
  28: K('2026-06-14T23:00:00Z'), // Saudi Arabia vs Uruguay       (H · SoFi)
  29: K('2026-06-15T02:00:00Z'), // Iran vs New Zealand           (G · Levi's)

  // Jun 15 (Mon) ─────────────────────────────
  30: K('2026-06-15T17:00:00Z'), // France vs Senegal             (I · Hard Rock)
  31: K('2026-06-15T20:00:00Z'), // Iraq vs Norway                (I · Estadio Azteca)
  32: K('2026-06-15T23:00:00Z'), // Argentina vs Algeria          (J · MetLife)
  33: K('2026-06-16T02:00:00Z'), // Austria vs Jordan             (J · Lincoln Financial)

  // Jun 16 (Tue) ─────────────────────────────
  34: K('2026-06-16T17:00:00Z'), // Portugal vs DR Congo          (K · Gillette)
  35: K('2026-06-16T20:00:00Z'), // England vs Croatia            (L · MetLife)
  36: K('2026-06-16T23:00:00Z'), // Ghana vs Panama               (L · AT&T)
  37: K('2026-06-17T02:00:00Z'), // Uzbekistan vs Colombia        (K · BMO Field)

  // ── ROUND 2 ────────────────────────────────────────────────

  // Jun 19 (Fri) ─────────────────────────────
  38: K('2026-06-19T17:00:00Z'), // Czechia vs South Africa       (A)
  39: K('2026-06-19T20:00:00Z'), // Switzerland vs Bosnia         (B)
  40: K('2026-06-19T23:00:00Z'), // Canada vs Qatar               (B)
  41: K('2026-06-20T02:00:00Z'), // Mexico vs South Korea         (A)

  // Jun 20 (Sat) ─────────────────────────────
  42: K('2026-06-20T17:00:00Z'), // USA vs Australia              (D)
  43: K('2026-06-20T20:00:00Z'), // Scotland vs Morocco           (C)
  44: K('2026-06-20T23:00:00Z'), // Brazil vs Haiti               (C)
  45: K('2026-06-21T02:00:00Z'), // Türkiye vs Paraguay           (D)

  // Jun 21 (Sun) ─────────────────────────────
  46: K('2026-06-21T17:00:00Z'), // Netherlands vs Sweden         (F)
  47: K('2026-06-21T20:00:00Z'), // Germany vs Ivory Coast        (E)
  48: K('2026-06-21T23:00:00Z'), // Ecuador vs Curaçao            (E)
  49: K('2026-06-22T02:00:00Z'), // Tunisia vs Japan              (F)

  // Jun 22 (Mon) ─────────────────────────────
  50: K('2026-06-22T17:00:00Z'), // Spain vs Saudi Arabia         (H)
  51: K('2026-06-22T20:00:00Z'), // Belgium vs Iran               (G)
  52: K('2026-06-22T23:00:00Z'), // Uruguay vs Cape Verde         (H)
  53: K('2026-06-23T02:00:00Z'), // New Zealand vs Egypt          (G)

  // Jun 23 (Tue) ─────────────────────────────
  54: K('2026-06-23T17:00:00Z'), // Argentina vs Austria          (J)
  55: K('2026-06-23T20:00:00Z'), // France vs Iraq                (I)
  56: K('2026-06-23T23:00:00Z'), // Norway vs Senegal             (I)
  57: K('2026-06-24T02:00:00Z'), // Jordan vs Algeria             (J)

  // Jun 24 (Wed) ─────────────────────────────
  58: K('2026-06-24T17:00:00Z'), // Portugal vs Uzbekistan        (K)
  59: K('2026-06-24T20:00:00Z'), // England vs Ghana              (L)
  60: K('2026-06-24T23:00:00Z'), // Panama vs Croatia             (L)
  61: K('2026-06-25T02:00:00Z'), // Colombia vs DR Congo          (K)

  // ── ROUND 3 (simultaneous within group) ────────────────────

  // Jun 27 (Sat) — Groups B, C, A ────────────
  62: K('2026-06-27T17:00:00Z'), // Bosnia vs Qatar               (B · simultaneous)
  63: K('2026-06-27T17:00:00Z'), // Switzerland vs Canada         (B · simultaneous)
  64: K('2026-06-27T20:00:00Z'), // Morocco vs Haiti              (C · simultaneous)
  65: K('2026-06-27T20:00:00Z'), // Scotland vs Brazil            (C · simultaneous)
  66: K('2026-06-27T23:00:00Z'), // Czechia vs Mexico             (A · simultaneous)
  67: K('2026-06-27T23:00:00Z'), // South Africa vs South Korea   (A · simultaneous)

  // Jun 28 (Sun) — Groups E, F, D ────────────
  68: K('2026-06-28T17:00:00Z'), // Curaçao vs Ivory Coast        (E · simultaneous)
  69: K('2026-06-28T17:00:00Z'), // Ecuador vs Germany            (E · simultaneous)
  70: K('2026-06-28T20:00:00Z'), // Japan vs Sweden               (F · simultaneous)
  71: K('2026-06-28T20:00:00Z'), // Tunisia vs Netherlands        (F · simultaneous)
  72: K('2026-06-28T23:00:00Z'), // Türkiye vs USA                (D · simultaneous)
  73: K('2026-06-28T23:00:00Z'), // Paraguay vs Australia         (D · simultaneous)

  // Jun 29 (Mon) — Groups I, H, G ────────────
  74: K('2026-06-29T17:00:00Z'), // Senegal vs Iraq               (I · simultaneous)
  75: K('2026-06-29T17:00:00Z'), // Norway vs France              (I · simultaneous)
  76: K('2026-06-29T20:00:00Z'), // Cape Verde vs Saudi Arabia    (H · simultaneous)
  77: K('2026-06-29T20:00:00Z'), // Uruguay vs Spain              (H · simultaneous)
  78: K('2026-06-29T23:00:00Z'), // Egypt vs Iran                 (G · simultaneous)
  79: K('2026-06-29T23:00:00Z'), // New Zealand vs Belgium        (G · simultaneous)

  // Jun 30 (Tue) — Groups L, K, J ────────────
  80: K('2026-06-30T17:00:00Z'), // Croatia vs Ghana              (L · simultaneous)
  81: K('2026-06-30T17:00:00Z'), // Panama vs England             (L · simultaneous)
  82: K('2026-06-30T20:00:00Z'), // Colombia vs Portugal          (K · simultaneous)
  83: K('2026-06-30T20:00:00Z'), // DR Congo vs Uzbekistan        (K · simultaneous)
  84: K('2026-06-30T23:00:00Z'), // Jordan vs Argentina           (J · simultaneous)
  85: K('2026-06-30T23:00:00Z'), // Algeria vs Austria            (J · simultaneous)
};
