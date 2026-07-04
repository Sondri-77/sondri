// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical site URL. Currently served from workers.dev; swap to the
// custom domain (e.g. https://sondri.ai) once DNS is attached.
const SITE = process.env.SITE_URL ?? 'https://sondri.smokeduncan.workers.dev';

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
