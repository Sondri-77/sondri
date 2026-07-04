# Sondri Website — Design & Architecture

**Date:** 2026-07-02
**Source of truth:** `design-system/Sondri Site.dc.html` + `design-system/Sondri Design System/Colour Scheme.dc.html` (the Space Grotesk / teal-ink iteration — the `screenshots/` serif images are earlier explorations; the Rocket Hero files are a standalone animation demo on a different palette, intentionally excluded).

## Goal

Turn the Sondri design-system prototype into a production, sales-focused marketing site and deploy it to Cloudflare (account `ce4bcc9130b13b4acc8c5e597ba93f3a`).

## Architecture decision

Three candidates were weighed:

| Option | Verdict |
|---|---|
| **A. Hand-rolled static HTML per page** | Fast, but nav/footer/section duplication across 6 pages makes upkeep error-prone. |
| **B. Astro 5 static MPA (chosen)** | Component reuse for the design system, zero JS shipped by default, real per-page URLs for SEO, builds to pure static files — the correct architecture for a marketing site. |
| **C. React SPA / Next.js** | Matches the prototype's mental model but is overkill: no dynamic data, SPA state-routing harms SEO/sharing, adds runtime weight for zero benefit. |

**Chosen: B.** Astro 5, fully static output (`output: 'static'`), no UI framework runtime. The prototype's canvas/scroll behaviors are ported as small dependency-free TypeScript modules loaded per page (progressive enhancement — all content is server-rendered HTML).

**Hosting: Cloudflare Workers static assets** (`wrangler deploy` with an `assets` config). This is Cloudflare's recommended path for new static sites (Pages is in maintenance mode). Global CDN, free tier, instant `*.workers.dev` URL, custom domain (sondri.ai) attachable later.

## Site map (prototype state-routing → real routes)

| Route | Prototype screen |
|---|---|
| `/` | Home (hero + robot, marquee, problem, what-we-do + puppet, 0→1→n, engagement ladder + bedrock) |
| `/how-it-works/` | How it works (hero + ridge dither, 8-week timeline, delivery engine, why-now) |
| `/industries/` | Industries (hero, 6 industry cards, sector reports, CTA) |
| `/for-customers/` | For customers (pains, what-you-get, pricing, unit economics, verticals) |
| `/about/` | About/Careers (vision hero + orb dither, why-join perks) |
| `/design-system/` | Field guide (palette, type, dither system, components) |
| `404` | On-brand terminal-artifact 404 page (new, required for a real site) |

## Project structure

```
sondri-site/
  src/
    styles/global.css        # design tokens (CSS custom props), base, keyframes, responsive rules
    layouts/Base.astro       # <head> (fonts/SEO/OG), nav, footer, cookie artifact, script wiring
    components/              # Nav, Footer, CookieArtifact, Kicker, SectionHead, CtaButton, DitherPanel…
    scripts/dither.ts        # Bayer-dither canvas engine (hero/puppet/orb/ridge/gold variants, robot silhouettes)
    scripts/enhance.ts       # scroll reveals (IntersectionObserver), neon-sign phrase cycling, consent persistence
    pages/                   # index, how-it-works, industries, for-customers, about, design-system, 404
  public/                    # favicon.svg, robots.txt
  wrangler.jsonc             # name=sondri, assets binding, account_id
  astro.config.mjs
```

## Key implementation decisions

1. **Dither engine ported faithfully** from the prototype's `dither()` (Bayer 4×4 threshold matrix, vertical drip streaks, animated robot silhouettes via SDF limbs, ~30 fps rAF loop, visible-canvas culling, `prefers-reduced-motion` fallback to a static frame + interval-based sign cycling, hero develops on scroll).
2. **Real links, not JS buttons.** Nav/footer/CTAs become `<a href>` — better SEO, middle-click, crawlability. `BOOK DISCOVERY` / contact CTAs point to `mailto:founder@sondri.ai` with pre-filled subjects (the only contact channel the design defines), making the site genuinely functional as sales collateral.
3. **Responsive layer added.** The prototype targets 1280 px. Production adds breakpoints: multi-column grids collapse (5→2→1 for the ladder, 3/4→2→1 elsewhere), nav collapses to an on-brand monospace menu toggle below 860 px, hero robot speech bubble hides on small screens.
4. **Cookie artifact kept** (it's part of the brand system), dismissal persisted in `localStorage`; shown only until dismissed.
5. **SEO/meta:** per-page `<title>`/description, Open Graph + Twitter cards, canonical URLs, `sitemap.xml` (via @astrojs/sitemap), `robots.txt`, theme-color.
6. **Fonts:** Google Fonts (Space Grotesk 400–700, Space Mono 400/700 + italic) with preconnect — matches the design file exactly.
7. **Accessibility:** semantic landmarks/headings, decorative canvases `aria-hidden`, focus-visible styles, marquee/climb animations honor reduced motion.
8. **Unused prototype data** (`team`, `traction`, `roadmap`) is not rendered by the prototype markup and is left out.

## Error handling

- Custom `404.html` served by Workers assets (`not_found_handling: "404-page"`).
- All client scripts are enhancement-only; the site is fully readable with JS disabled (canvases simply stay dark).

## Testing / validation

- `astro build` (includes `astro check`-level template validation) must pass.
- `tsc --noEmit` on the TS scripts via `astro check`.
- Visual verification of every route in a real browser (screenshots) before deploy.
- Post-deploy smoke check of the live `workers.dev` URL for every route + 404.

## Deployment

- `wrangler deploy` with `assets.directory = ./dist`, `account_id = ce4bcc9130b13b4acc8c5e597ba93f3a`.
- Wrangler OAuth is currently expired on this machine; re-auth via `wrangler login` at deploy time.
