# FlapWorld — Design Brief (Phase 1: Landing + Markets)

> Paste everything below into claude.ai/design. If you have a visual reference
> (e.g. a screenshot of an interface you like), attach it as an image — the tool
> reads images far better than a text description.

---

You are designing the front-end for **FlapWorld**, a World Cup 2026 prediction-market
app on BNB Chain. Treat this as a **greenfield build**: there is no existing design to
preserve — reinvent it from scratch. The current UI works but is flat and forgettable.
Your job is to make it **bold, high-impact, and unforgettable** while keeping a real
financial product legible and trustworthy. You have **full creative latitude** over art
direction, layout, typography, color, and motion. Surprise me — make something someone
would screenshot and share.

**[If a reference image is attached: use it as a north-star for energy, polish, and
aesthetic — match the *vibe* and craft level, don't copy it literally.]**

## The product
FlapWorld lets anyone bet on 2026 FIFA World Cup outcomes using **BNB**. Pick a team or
outcome, buy a position with BNB, and sell/withdraw before the market closes. Results
settle **on-chain** from Flap's WorldCupViewer contract on BSC. The audience is the
global crypto crowd plus a strong Chinese-crypto community, so the app is **bilingual
(EN / 中文)**. It should feel like **the adrenaline of the World Cup meets the edge of
on-chain trading** — premium, fast, alive.

## Scope for this pass
Two screens, **fully responsive (design both mobile and desktop)**:
1. **Home / Landing** — a hero that sells the concept in 3 seconds.
2. **Markets** — the core experience: browse markets, pick an outcome, and an order
   ticket to buy/sell.

(Full wallet management and the Portfolio page come in a later phase. Show a prominent
"Connect wallet" entry point, but don't build the full wallet flow here.)

## Screen 1 — Home / Landing
- **Top nav:** the **FlapWorld** wordmark/logo, links (Home, Markets, Portfolio, About),
  a **language toggle (EN / 中文)**, and a prominent **Connect wallet** button. The nav rides
  over the hero video — keep it readable via the mask below, not a dark bar.

### The hero IS the signature moment: a scroll-driven cinematic video
Build a **full-viewport (100vh) hero** with a **full-bleed background video tied to scroll**:
- The video's playback is **scrubbed by scroll progress** (use GSAP ScrollTrigger): as the
  user scrolls down, the scene plays / opens up (a slow cinematic pull-back / zoom-out), then
  hands off to the rest of the page.
- The hero **content (headline, subhead, CTAs) emerges from behind the scene** via a
  **gradient mask** — a solid→transparent gradient applied as a CSS mask from the lower/middle
  of the section upward, so the text and buttons rise out of the footage as you scroll. Do NOT
  put a dark overlay or a translucent box behind the text.
- **Video at 100% opacity, no overlay, no forced dark mode.** Readability comes from the mask,
  not from dimming the video.
- **Placeholder video for now:** use a cinematic stock clip (stadium / football / sky /
  abstract golden energy) as a temporary source, exposed as a single obvious constant
  (e.g. `HERO_VIDEO_SRC`) so the real render can be swapped in later by changing one link.
- **Placeholder caveat:** a generic stock clip is not a real frame1→frame2 pull-back, so fully
  scrubbing it on scroll shows the *mechanic* but not the "scene opens up" story. For now an
  autoplay muted loop (or a gentle scroll-linked scale / parallax) is fine; wire the full
  scroll-scrubbed pull-back once the real render replaces `HERO_VIDEO_SRC`.
- Headline + subhead centered toward the top. Core promise: *"World Cup 2026 prediction
  markets on BNB Chain — pick an outcome, buy with BNB, sell before kickoff."* Primary CTA
  ("Explore markets") + secondary ("How it works").

### Below the hero — standard layout (the cinematic treatment stays in the hero ONLY)
- **Stats strip** (scale & trust): e.g. **85 markets**, **3 categories**, **BNB Chain (BSC)**,
  **1% fee**, **on-chain settlement**.
- **How it works:** Pick → Buy with BNB → Sell/withdraw before close → Settled on-chain by
  WorldCupViewer.
- A clean closing CTA into Markets.
These sections are normal, well-paced layout — they do **not** use the video or forced 100vh.

## Screen 2 — Markets (the heart of the app)
Three market categories as switchable tabs:
- **Matches** (Match Winner) — ~72 markets. Each is one game with three outcomes:
  Home / Draw / Away (e.g. "Mexico vs South Africa" → 🇲🇽 Mexico · ↔ Draw · 🇿🇦 South Africa).
- **Groups** (Group Winner) — 12 markets, Groups A–L, each listing the contending teams.
- **Tournament** (Tournament Winner) — 1 outright board: "2026 FIFA World Cup Winner"
  with 24+ teams to scroll (Spain 🇪🇸, France 🇫🇷, England 🏴, Argentina 🇦🇷, Brazil 🇧🇷,
  Portugal 🇵🇹, Germany 🇩🇪, Netherlands 🇳🇱, USA 🇺🇸, Morocco 🇲🇦, Japan 🇯🇵, …).

**Find & filter** (the markets floor must be navigable with 72+ markets): a **search by
team / match**, **sort** (by close time and by pool size), and an **"All markets"** view
that spans categories — plus a clean **empty state** ("No markets match your filters")
when nothing matches.

**Market card:** title, close time **with a live countdown**, category tag, and tappable
**outcome buttons**. Each outcome shows a **country flag + team name** and a
**price/odds or pool-share indicator** (you design the treatment — treat the numbers as
illustrative live data; real values come from on-chain pools). Selecting an outcome
highlights it and feeds the order ticket.

**Order ticket** (sticky side panel / bottom sheet on mobile) — make it feel like a slick
trading ticket, not a boring form:
- Current selection (flag + team + market name).
- **Amount in BNB** input.
- Live breakdown: **1% platform fee** (non-refundable), **net stake into the pool**, and
  an optional **potential win** estimate (illustrative).
- Two actions: **Buy** and **Sell / withdraw** (selling before close returns only the net
  stake — the entry fee is not refunded).
- Before a wallet is connected, show an honest **"Connect to trade"** state.

**Market states to design for:** Open · Closing soon (countdown) · Closed/Locked ·
Resolved (winner shown) · Pending (no result yet). Use clear status badges.

## Brand & data truths (keep these accurate)
- Currency is **BNB**; chain is **BNB Chain (BSC, chain id 56)**.
- Fee is exactly **1%**, charged on buy, not refunded on early sell.
- Outcomes map to real on-chain team IDs; reserved: **49 = "Others", 50 = "Draw"**.
- **Never fabricate match results** — settlement is read on-chain from WorldCupViewer.
  Use honest loading / pending / empty states.
- Real teams + flags (emoji or flag images). Copy should be **bilingual-ready**
  (EN primary, 中文 secondary).

## Art direction
- **Full creative freedom.** Aim for **distinctive, premium, high-energy** — the opposite
  of a generic crypto dashboard or a Bootstrap template.
- Dark-first is a safe base, but explore. Give it a **strong typographic personality**,
  **intentional motion** (entrances, hovers, scroll-driven reveals, a satisfying
  micro-interaction when an outcome is selected), and **at least one "wow" moment**.
- It must still read as a **money product**: amounts, odds, fees, and countdowns must be
  instantly scannable. Don't let style bury the data.
- **Responsive and accessible:** real focus states, strong contrast, mobile-first (a lot
  of crypto traffic is mobile).

## Tech (for clean hand-off)
Build it in **React + TypeScript + Tailwind CSS** (the codebase already uses these;
**Framer Motion** and **GSAP** are available for motion). Component-based, no real backend
calls — use realistic **mock data** that matches the structures above.

## Deliver
Home + Markets, desktop and mobile, with the order-ticket interaction working against mock
data. **Push the aesthetic hard** — this should feel like a flagship product launch, not
an MVP.

---

## Appendix — the hero video (placeholder now, real render later)

**Placeholder sources (free):** grab any cinematic stadium/football/sky/abstract clip from
**Pexels Videos**, **Coverr**, or **Mixkit**, and set it as `HERO_VIDEO_SRC`. That's enough
to design and feel the scroll effect.

**When you want the real, branded video** (the technique from the reference thread):
1. **Two frames** — generate frame 1 in any image model, then ask for frame 2 from the same
   world (a pull-back), so a video model can interpolate between them. Theme: World Cup + BNB.
   - Frame 1: *"A cinematic hero scene: a glowing golden football glides through a vast modern
     stadium at golden hour, volumetric light beams, atmospheric haze, premium award-winning
     web design quality, wide shot, deep empty space at the top for text, teal-and-gold grade."*
   - Frame 2 (run on that image): *"Zoom out from this exact scene and open it up — pull back
     so the stadium becomes a glowing arena seen from above; keep the same colors, light, and
     style, do not change anything else."*
2. **Animate** both frames in **Kling** (or Seedance / Higgsfield), 10s, 1080p:
   *"animate this smooth transition from frame one to frame two, natural and aesthetic
   cinematic camera pull-back."* Keep whichever render flies cleaner.
3. **Swap** the link: replace `HERO_VIDEO_SRC` with your render. One line, done.
