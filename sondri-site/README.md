# Sondri website

Production marketing site for Sondri, built from the design-system prototype
(`../design-system/Sondri Site.dc.html`).

**Live:** https://sondri.sondri.workers.dev

## Stack

- **[Astro 5](https://astro.build)** — static multi-page site, zero client framework runtime.
- **Cloudflare Workers static assets** — global CDN hosting (account `Sondri Cockpit` / `ce4bcc9130b13b4acc8c5e597ba93f3a`).
- Vanilla TypeScript for the canvas dither engine and progressive enhancements (no runtime deps shipped).

## Commands

```bash
npm install        # install deps
npm run dev        # local dev server (http://localhost:4321)
npm run build      # build static site to ./dist
npm run preview    # serve the built ./dist locally
npm run check      # astro check (TypeScript + template diagnostics)
npm run deploy     # build + wrangler deploy to Cloudflare
```

## Deploying

Auth is via wrangler OAuth (`npx wrangler login`, already done for smokeduncan@gmail.com).
`wrangler.jsonc` pins the account id and the `sondri` workers.dev subdomain, so
`npm run deploy` publishes to https://sondri.sondri.workers.dev.

To attach a custom domain (e.g. `sondri.ai`), add a `routes` entry to
`wrangler.jsonc` once the zone is on this Cloudflare account, then set
`SITE_URL=https://sondri.ai` before building so canonical/OG/sitemap URLs match.

## Structure

```
src/
  data.ts              # all site copy, ported verbatim from the prototype
  styles/global.css    # design tokens (CSS custom properties), base, keyframes
  layouts/Base.astro   # <head>/SEO/OG, nav + footer + cookie, script wiring
  components/          # Nav, Footer, CookieArtifact
  scripts/
    dither.ts          # Bayer-dither canvas engine (hero/puppet/orb/ridge/gold + robot silhouettes)
    enhance.ts         # scroll reveals, neon-sign phrase cycling, consent persistence, mobile nav
  pages/              # index, how-it-works, industries, for-customers, about, design-system, 404, robots.txt
```

## Notes for future work

- The dither engine (`scripts/dither.ts`) is a faithful port of the prototype's
  `dither()`: Bayer 4×4 threshold, vertical drip streaks, SDF-based animated
  robot silhouettes, ~30fps rAF loop, visible-canvas culling, and a
  `prefers-reduced-motion` fallback (static frame + interval-based sign cycling).
- Contact CTAs are `mailto:founder@sondri.ai` — the only channel the design
  defines. Swap for a real form/booking link when one exists.
- Design docs: `docs/superpowers/specs/2026-07-02-sondri-website-design.md`.
