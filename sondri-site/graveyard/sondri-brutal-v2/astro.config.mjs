// @ts-check
import { defineConfig } from 'astro/config';

// Brutalist study v2: the Outsource Consultants (Nuxt) layout system, rebuilt
// with Sondri's palette, logo, and copy. Own port (4331) so it can sit next to
// sondri-site and sondri-brutal.
export default defineConfig({
  site: 'https://sondri.ai',
  output: 'static',
  trailingSlash: 'ignore',
  server: { port: 4331 },
  build: { format: 'directory', inlineStylesheets: 'auto' },
});
