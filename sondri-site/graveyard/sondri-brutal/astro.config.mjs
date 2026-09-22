// @ts-check
import { defineConfig } from 'astro/config';

// Brutalist design study: the Blacksmith (Webflow) layout system, rebuilt
// with Sondri's palette, logo, and copy. Runs on its own port (4330) so it can sit
// side by side with sondri-site.
export default defineConfig({
  site: 'https://sondri.ai',
  output: 'static',
  trailingSlash: 'ignore',
  server: { port: 4330 },
  build: { format: 'directory', inlineStylesheets: 'auto' },
});
