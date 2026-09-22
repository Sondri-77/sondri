# Sondri

> **All-inclusive AI Agent, Business & Coding Expert**

Sondri is an AI-driven platform built for forward-deployed engineering, business intelligence, and automated software delivery. This repository contains the core platform specifications, design prototypes, pitch materials, and the official production marketing website.

---

## 🌐 Live Application

* **Live Marketing Site:** [https://sondri.ai](https://sondri.ai) *(Fallback: [https://sondri.sondri.workers.dev](https://sondri.sondri.workers.dev))*
* **Cloudflare Dashboard:** [Account Overview](https://dash.cloudflare.com/ce4bcc9130b13b4acc8c5e597ba93f3a/domains/overview)

---

## ⚡ Quick Start

Run development server directly from the root directory:

```bash
# Install site dependencies (bun.lock is the tracked lockfile)
bun install --cwd sondri-site

# Start local dev server (http://localhost:4321) — or `docker compose up -d synthesis`
bun run --cwd sondri-site dev

# Check TypeScript & Astro template diagnostics
bun run --cwd sondri-site check

# Build static bundle for production
bun run --cwd sondri-site build
```

---

## 📂 Repository Layout

```
Sondri/
├── sondri-site/             # Production marketing site: one page + 404 (Astro 5 + TypeScript)
│   ├── src/
│   │   ├── components/      # The 12 home sections, Nav, Footer, CalModal
│   │   ├── layouts/         # Base layout: SEO head metadata, nav, footer
│   │   ├── pages/           # index, 404, robots.txt
│   │   └── scripts/         # Hero canvas: gradient-map dither + pixel trail
│   ├── graveyard/           # Retired pages and the sondri-brutal / -v2 design studies
│   ├── astro.config.mjs     # Astro configuration
│   └── wrangler.jsonc       # Cloudflare Workers configuration
├── copy-workbench/          # Copy tool (http://localhost:4350), reads sondri-site/src/data.ts
├── design-system/           # HTML prototypes, visual specifications & animations
│   ├── Sondri Site.dc.html  # Interactive HTML site design spec
│   └── rocket-scene.jsx     # Three.js animation prototype
├── docs/                    # Business goals, pitch decks, and enterprise prompts
│   ├── business/            # Roadmap goals, sales notes & account links
│   ├── decks/               # Pitch & AI product decks (.pptx)
│   └── rfp-prompts/         # SAP ERP functional & cross-cutting prompt specs
├── .github/
│   └── workflows/
│       └── deploy.yml       # Automated GitHub Actions deployment pipeline
├── package.json             # Root monorepo script runner
└── README.md                # Repository documentation
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Astro 5](https://astro.build) | Ultra-fast static multi-page architecture |
| **Language** | [TypeScript](https://www.typescriptlang.org) | Strict type safety for canvas engines & enhancements |
| **Hosting** | [Cloudflare Workers](https://workers.cloudflare.com) | Global edge CDN static asset hosting |
| **Graphics** | HTML5 Canvas / Three.js | Bayer 4x4 dither rendering engine & 3D scenes |
| **CI/CD** | GitHub Actions | Automated build, check, and deployment pipeline |

---

## 🚀 Continuous Integration & Deployment (CI/CD)

Automated deployments are powered by GitHub Actions ([.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml)).

* **Trigger**: Every `push` to `main` touching `sondri-site/**` automatically builds and deploys to Cloudflare Workers.
* **Manual Deploy**: Available under the repository **Actions** tab.

### Required Secrets

To configure deployment on a fork or new environment, add `CLOUDFLARE_API_TOKEN` under **Settings → Secrets and variables → Actions** (scoped to the `Sondri Cockpit` Cloudflare account).

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE).
