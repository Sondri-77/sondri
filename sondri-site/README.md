# Sondri website

The production marketing site: one page, the brutalist design reviewed on the
`sondri-brutal` study (decisions.md D5), plus a custom 404.

**Live:** https://sondri.ai (Cloudflare Workers static assets, worker `sondri`)

## Stack

- **[Astro 5](https://astro.build)** — static build, no client framework.
- **Cloudflare Workers static assets** — `wrangler.jsonc` pins account
  `ce4bcc9130b13b4acc8c5e597ba93f3a`, the `sondri` worker and the custom domains.
- Vanilla TypeScript for the hero canvas (gradient-map dither + pixel trail).

## Commands

```bash
bun install        # install deps (bun.lock is the tracked lockfile)
bun run dev        # dev server (http://localhost:4321; compose service `synthesis`)
bun run check      # astro check (TypeScript + template diagnostics)
bun run build      # static site → ./dist
bun run preview    # serve ./dist
bun run deploy     # build + wrangler deploy
```

`bunx wrangler dev --local` serves `dist/` the way Cloudflare does, including
`public/_redirects` and the 404 page.

## Structure

```
src/
  data.ts            # shared copy: contact, booking link, CTAs (also read by copy-workbench)
  home-data.ts       # the home page's 12 sections, approved copy (D4)
  brutal-data.ts     # nav, announcement bar, footer columns
  layouts/Base.astro # <head> (canonical, sitemap, OG, Organization schema), Nav, Footer, reveal
  components/        # Hero … FinalCta (12 sections), Nav, Footer, CalModal
  scripts/           # hero-fx, pixel-trail, dither-block
  styles/brutal.css  # tokens and the layout system
  pages/             # index, 404, robots.txt
public/
  _redirects         # old routes → / (301), honoured by Cloudflare static assets
  icons/             # Pixel Icon Library, CC BY 4.0 — see NOTICES.md
```

## Routes

`/` and `/404`. Everything that used to be a page (`/about`, `/how-it-works`,
`/get-in-touch`, `/pay`, `/success`, `/styleguide`, `/for-customers`,
`/design-system`) redirects to `/`; unknown paths get the 404 page
(`not_found_handling: 404-page`). Booking opens the Cal.com embed
(`CalModal`) on every `cal.com/sondri/discovery` link.
