/** Global atmospheric background: slow-drifting brand auras + vignette behind
 *  all content. Kills the flat "dead" charcoal field and gives the whole page
 *  continuous depth (the EverSwap-style living background). Pure CSS, cheap. */
export function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Burgundy aura, top-left */}
      <div
        className="fw-aura fw-aura-a absolute h-[70vh] w-[70vw]"
        style={{ background: 'radial-gradient(circle at center, oklch(58% 0.18 25 / 0.16), transparent 68%)' }}
      />
      {/* Gold aura, bottom-right */}
      <div
        className="fw-aura fw-aura-b absolute h-[65vh] w-[65vw]"
        style={{ background: 'radial-gradient(circle at center, oklch(82% 0.13 85 / 0.10), transparent 68%)' }}
      />
      {/* Cool counter-glow, mid-right for separation */}
      <div
        className="fw-aura fw-aura-c absolute h-[50vh] w-[50vw]"
        style={{ background: 'radial-gradient(circle at center, oklch(40% 0.07 300 / 0.10), transparent 70%)' }}
      />
      {/* Vignette to focus the center column */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(130% 90% at 50% 30%, transparent 45%, oklch(10% 0.012 30 / 0.6) 100%)' }}
      />
    </div>
  );
}
