# Sondri cinematic redesign — design spec

Date: 2026-07-06 · Branch: `redesign/cinematic` (never main) · Approved by user in chat.

## Goal

Elevate the site to launch-ready, "screams professionals" quality: an award-winning
cinematic 3D scroll experience layered onto the existing ink/gold dither identity,
plus an enterprise-first sales-copy pass. Keep everything the user liked (dither
robots, neon signs, ladder) and take it to the next level.

## 1. Hero orbit — real-time 3D turntable with dither post

**Technology decision:** real-time Three.js scene with a custom Bayer-dither
post-process shader (same 4×4 matrix as `dither.ts`), NOT a pre-rendered frame
sequence. Rationale: no render farm in repo, 150KB gzip vs 5–15MB of frames,
scrubbing is continuous (no frame stepping), and the dither pass preserves the
pixelated brand soul.

- **Robot:** procedural primitives matching the current SDF silhouette (head,
  antenna, torso, hips, limbs). Brushed **black titanium**: `MeshPhysicalMaterial`,
  near-black base, high metalness, anisotropy-style micro-roughness via noise map.
- **Face:** **sapphire glass** — deep-blue transmissive `MeshPhysicalMaterial`
  visor panel, with engraved "SONDRI" indices band (canvas-generated texture used
  as roughness/emissive detail).
- **Lighting:** black void background; dramatic warm-gold **rim light** behind-left,
  low warm key, faint cool fill so titanium reads.
- **Particles:** ~400 gold dust points, additive blending, slow drift (fewer on mobile).
- **Dither pass:** render to low-res target (~1/5 device px), full-screen quad shader
  applies Bayer 4×4 threshold mapped to ink → bone/gold palette. Output is chunky
  pixels — genuinely 3D, unmistakably Sondri.

## 2. Scroll choreography (Apple-style scrub)

One tall pin container (~750vh) with a sticky full-viewport canvas. Scroll progress
(rAF-lerp smoothed, so it feels weighted) drives a single camera timeline:

- **Phase A — Turntable (0 → 0.55):** perfectly smooth 360° studio orbit around the
  floating robot. Headline/copy beats (absolutely positioned, opacity+translate
  keyed to progress windows) track in and out at set angles.
- **Phase B — Macro fly-through (0.55 → 1.0):** camera dollies into extreme close-up,
  glides across the brushed shoulder, over the sapphire face and along the engraved
  SONDRI indices. Short "forged/crafted" copy beats pinned to each glide segment,
  mapping craft language to the business.
- After the pin releases, the page continues into the elevated standard sections.

## 3. Site-wide motion elevation

- Word-level staggered headline reveals (split to spans, IntersectionObserver).
- Count-up animation on stat numbers.
- Magnetic CTA buttons (subtle cursor-follow translate).
- Film-grain overlay + refined glow layering for depth.
- Existing signature moments retained downstream: neon sign + puppet robot,
  engagement ladder + climber, marquee (upgraded with hover glow).

## 4. Enterprise-first copy pass (user-selected positioning)

Unify all pages on the enterprise buyer: Private Equity, Financial Services,
Fintech & Payments, Healthtech, CPG & Retail, Real Estate.

- Hero rewritten (fixes "AI agents, FDE's deployed…" grammar); marquee = verticals;
  neon phrases rewritten from insider jargon to buyer language; problem stats
  reframed to enterprise pain; pricing framed as engagement tiers for enterprise/PE;
  for-customers page reframed; every page ends with one clear CTA (Discovery Sprint).
- Voice: confident, precise, no hype adjectives; monospace-label aesthetic kept.

## 5. Fallbacks & performance

- `prefers-reduced-motion`: no pin/scrub; static beauty-shot render + normal page flow.
- No WebGL: fall back to the existing 2D dither hero.
- Mobile: shorter pin, ~120 particles, DPR cap 1, smaller RT.
- Pause rendering when tab hidden or canvas off-screen.
- Three.js is added to the homepage only; other pages stay zero-runtime-dependency.

## 6. Validation

`npm run check` (astro check), `npm run build`, and preview-server browser
verification (scroll behaviour, fallbacks, mobile viewport, console clean).

## Out of scope

Payment portal, real contact forms, CMS, deployment changes. Deploy workflow only
runs on main, so the branch never auto-deploys.
