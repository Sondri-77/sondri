// @ts-check
import { defineConfig } from 'astro/config';

// Copy workbench: sondri-site page for page, design stripped. Reads the live
// data.ts so copy can never drift from the real site. Own port (4350).
export default defineConfig({
  output: 'static',
  server: { port: 4350 },
  trailingSlash: 'ignore',
});
