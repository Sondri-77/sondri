// @ts-check
import { defineConfig } from 'astro/config';

// Copy workbench: every string on the current site (sondri-site), page by
// page, section by section, with zero design. Reads the live data.ts so the
// generated copy can never drift from the real site. Own port (4350).
export default defineConfig({
  output: 'static',
  server: { port: 4350 },
});
