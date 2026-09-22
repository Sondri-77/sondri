// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical site URL. Set SITE_URL to build against another host.
const SITE = process.env.SITE_URL ?? 'https://sondri.ai';

// One page. Old routes are redirected to `/` by `public/_redirects`, which
// Cloudflare's static assets honour with a real 301 — Astro's `redirects`
// option would emit meta-refresh pages instead.
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
