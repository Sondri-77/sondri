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
  // Old pages removed in the restructure; keep indexed URLs alive.
  redirects: {
    '/for-customers/': '/how-it-works/',
    '/design-system/': '/',
  },
  integrations: [
    sitemap({
      // Confirmation page — not a destination worth indexing.
      filter: (page) => !page.includes('/success/'),
    }),
  ],
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
