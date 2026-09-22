# Sondri — Copy Review

Plain-markdown extraction of every word on the site, one file per page, broken out by section.
Scratch/working directory — safe to edit freely, nothing here is imported by the build.

Edit the copy in these files, then hand them back and the changes get applied to the source.

## Pages

| File | Route | Source |
|---|---|---|
| [index.md](index.md) | `/` | `src/pages/index.astro` |
| [how-it-works.md](how-it-works.md) | `/how-it-works/` | `src/pages/how-it-works.astro` |
| [industries.md](industries.md) | `/industries/` | `src/pages/industries.astro` |
| [for-customers.md](for-customers.md) | `/for-customers/` | `src/pages/for-customers.astro` |
| [pay.md](pay.md) | `/pay/` | `src/pages/pay.astro` |
| [success.md](success.md) | `/success/` | `src/pages/success.astro` |
| [about.md](about.md) | `/about/` | `src/pages/about.astro` |
| [design-system.md](design-system.md) | `/design-system/` | `src/pages/design-system.astro` |
| [404.md](404.md) | 404 | `src/pages/404.astro` |
| [_global.md](_global.md) | all pages | `src/components/Nav.astro`, `Footer.astro`, `CookieArtifact.astro` |

## Where the copy actually lives

Most text is centralized in **`src/pages/../data.ts`** and rendered by the `.astro` pages.
Each section below is annotated with its origin — either `data.ts → exportName` or `inline in <page>.astro`.
Copy that is *inline* is a one-off edit in the page; copy from `data.ts` is shared and may appear on more than one page
(e.g. `timeline` appears on both **how-it-works** and **for-customers**).
