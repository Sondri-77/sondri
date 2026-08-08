// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical site URL. Currently served from workers.dev; swap to the
// custom domain (e.g. https://sondri.ai) once DNS is attached.
const SITE = process.env.SITE_URL ?? 'https://sondri.ai';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  // Old pages removed in the 3-page restructure; keep indexed URLs alive.
  redirects: {
    '/industries/': '/',
    '/for-customers/': '/how-it-works/',
    '/about/': '/get-in-touch/',
    '/design-system/': '/',
  },
  integrations: [sitemap()],
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
