import { BOOK_HREF, CONTACT_EMAIL } from '../data';
import { WATCH_CLIENT_CATALOG, type WatchClientSkuInfo } from '../data/watch-catalog';
import {
  getWatchGuides,
  getWatchServices,
  type WatchGuideEntry,
  type WatchServiceEntry,
} from '../data/watch-content';
import type { Lang } from '../i18n';

function prefixOf(lang: Lang): string {
  return lang === 'es' ? '/es/watch' : '/watch';
}

function escapeYaml(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim();
}

function frontmatter(meta: {
  title: string;
  description: string;
  url: string;
  lang: Lang;
}): string[] {
  return [
    '---',
    `title: "${escapeYaml(meta.title)}"`,
    `description: "${escapeYaml(meta.description)}"`,
    `url: "${meta.url}"`,
    `language: ${meta.lang}`,
    '---',
    '',
  ];
}

function formatSkuRow(skuId: string, lang: Lang): string {
  const item: WatchClientSkuInfo | undefined = WATCH_CLIENT_CATALOG[skuId];
  if (!item) return '';
  const isEs = lang === 'es';
  const title = isEs ? item.titleEs : item.titleEn;
  const price = isEs ? item.priceEs : item.priceEn;
  const guarantee = isEs ? item.guaranteeEs : item.guaranteeEn;
  const billing =
    item.mode === 'subscription'
      ? isEs
        ? 'Suscripción mensual'
        : 'Monthly subscription'
      : isEs
        ? 'Pago único'
        : 'One-time';
  return `| **${title}** | ${price} | ${billing} | ${guarantee} |`;
}

function formatSkuTable(skuIds: string[], lang: Lang): string[] {
  const isEs = lang === 'es';
  const header = isEs
    ? '| Plan / Servicio | Precio (USD) | Modalidad | Alcance y garantía |'
    : '| Plan / Service | Price (USD) | Billing | Scope & Guarantee |';
  return [
    header,
    '| --- | --- | --- | --- |',
    ...skuIds.map((id) => formatSkuRow(id, lang)).filter(Boolean),
  ];
}

function formatSkuBullet(skuId: string, lang: Lang): string {
  const item = WATCH_CLIENT_CATALOG[skuId];
  if (!item) return '';
  const isEs = lang === 'es';
  const title = isEs ? item.titleEs : item.titleEn;
  const price = isEs ? item.priceEs : item.priceEn;
  const guarantee = isEs ? item.guaranteeEs : item.guaranteeEn;
  return `- **${title} (${price}):** ${guarantee}`;
}

function nextStepsSection(origin: string, lang: Lang): string[] {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  return [
    `## ${isEs ? 'Siguientes pasos' : 'Next Steps'}`,
    '',
    isEs
      ? `- **Diagnóstico gratuito en 60 segundos:** ${origin}/ai-audit/`
      : `- **Run a Free 60-Second AI Check:** ${origin}/ai-audit/`,
    isEs
      ? `- **Ver todos los planes y precios:** ${origin}${prefix}/pricing/`
      : `- **View All Plans & Pricing:** ${origin}${prefix}/pricing/`,
    isEs
      ? `- **Agendar llamada gratuita:** ${BOOK_HREF}`
      : `- **Book a Free Strategy Call:** ${BOOK_HREF}`,
    `- **Email:** ${CONTACT_EMAIL}`,
    '',
  ];
}

export function renderWatchOverviewMarkdown(origin: string, lang: Lang = 'en'): string {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  const title = isEs
    ? 'Sondri Watch — Visibilidad IA y Sitios Web'
    : 'Sondri Watch — Get Found When Buyers Ask AI';
  const description = isEs
    ? 'Revisa gratis cómo ChatGPT, Gemini y Google AI describen tu negocio. Auditoría $99, Webs desde $390 y planes Watch desde $149/mes.'
    : 'Free 60-second AI visibility & readiness check across ChatGPT, Gemini, and Google AI. $99 full audit, websites from $390, monthly plans from $149/mo.';

  return [
    ...frontmatter({ title, description, url: `${origin}${prefix}/`, lang }),
    `# ${title}`,
    '',
    description,
    '',
    isEs
      ? 'Sondri Watch mide y mejora con qué frecuencia ChatGPT, Gemini, Google AI Overviews y Google AI Mode nombran, citan y recomiendan tu negocio—y construye sitios web rápidos y estructurados para que la IA pueda leer y verificar tus servicios.'
      : 'Sondri Watch measures and improves how often ChatGPT, Gemini, Google AI Overviews, and Google AI Mode name, cite, and recommend your business—plus fast Answer-Ready websites built for machine readability.',
    '',
    `## ${isEs ? 'Resumen de Precios (USD)' : 'Pricing Snapshot (USD)'}`,
    '',
    isEs
      ? '- **Chequeo Técnico + Score IA:** $0 gratis (robots.txt, schema JSON-LD, PageSpeed y 3 prompts reales)'
      : '- **Technical & AI Check:** $0 free (robots.txt, JSON-LD schema, PageSpeed & 3 live buyer prompts)',
    `- ${formatSkuBullet('aeo_full_audit', lang).slice(2)}`,
    `- ${formatSkuBullet('watch_local', lang).slice(2)} (${WATCH_CLIENT_CATALOG.watch_commerce.priceEs} Commerce / ${WATCH_CLIENT_CATALOG.watch_pro.priceEs} Pro)`,
    isEs
      ? `- **Sitios Web Answer-Ready:** ${WATCH_CLIENT_CATALOG.website_quick_fix.priceEs} (Quick Fix) · ${WATCH_CLIENT_CATALOG.website_5page.priceEs} (5 páginas) · ${WATCH_CLIENT_CATALOG.website_10page.priceEs} (10 páginas)`
      : `- **Answer-Ready Websites:** ${WATCH_CLIENT_CATALOG.website_quick_fix.priceEn} (Quick Fix) · ${WATCH_CLIENT_CATALOG.website_5page.priceEn} (5-Page) · ${WATCH_CLIENT_CATALOG.website_10page.priceEn} (10-Page)`,
    `- ${formatSkuBullet('watch_agency_client', lang).slice(2)}`,
    '',
    `## ${isEs ? 'Páginas Principales de Sondri Watch' : 'Sondri Watch Core Pages'}`,
    '',
    `- [${isEs ? 'Precios y Planes' : 'Pricing & Plans'}](${origin}${prefix}/pricing/) ([Markdown](${origin}${prefix}/pricing.md))`,
    `- [${isEs ? 'Servicios Especialistas' : 'Specialist Services'}](${origin}${prefix}/services/) ([Markdown](${origin}${prefix}/services/index.md))`,
    `- [${isEs ? 'Guías Claras EN/ES' : 'Plain-English AI Guides'}](${origin}${prefix}/guides/) ([Markdown](${origin}${prefix}/guides/index.md))`,
    `- [${isEs ? 'Playbooks por Industria' : 'Industry Playbooks & Fix Sprints'}](${origin}${prefix}/playbooks/) ([Markdown](${origin}${prefix}/playbooks.md))`,
    `- [${isEs ? 'Programa para Agencias' : 'Agency White-Label Program'}](${origin}${prefix}/partners/) ([Markdown](${origin}${prefix}/partners.md))`,
    `- [${isEs ? 'Reporte Mensual de Ejemplo' : 'Sample Monthly Watch Report'}](${origin}${prefix}/sample-report/) ([Markdown](${origin}${prefix}/sample-report.md))`,
    '',
    ...nextStepsSection(origin, lang),
  ].join('\n');
}

export function renderWatchPricingMarkdown(origin: string, lang: Lang = 'en'): string {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  const title = isEs
    ? 'Planes, Auditoría, Sitios Web y Sprints — Sondri Watch'
    : 'Transparent Pricing, Websites & Audits — Sondri Watch';
  const description = isEs
    ? 'Auditoría Base ($99 abonable al Mes 1), monitoreo Watch mensual ($149–$399/mes), Sitios Web Answer-Ready desde $390 y Sprints únicos ($249–$499).'
    : 'Clear AI visibility pricing: $99 15-question audit (credited to Month 1), monthly Watch plans ($149–$399/mo), Answer-Ready Websites ($390–$1,190), and fix sprints.';

  return [
    ...frontmatter({ title, description, url: `${origin}${prefix}/pricing/`, lang }),
    `# ${title}`,
    '',
    description,
    '',
    `## 1. ${isEs ? 'Auditorías y Sprints de Pago Único' : 'Audits & One-Time Implementation Sprints'}`,
    '',
    ...formatSkuTable(['aeo_full_audit', 'listings_sprint', 'fix_sprint', 'portfolio_snapshot'], lang),
    '',
    `## 2. ${isEs ? 'Planes Mensuales Sondri Watch' : 'Monthly Watch Monitoring Plans'}`,
    '',
    isEs
      ? 'Monitoreo semanal en sesión limpia sobre ChatGPT, Gemini, Google AI Overviews y Google AI Mode, más mejoras técnicas incluidas.'
      : 'Weekly logged-out prompt tracking across ChatGPT, Gemini, Google AI Overviews, and Google AI Mode, plus shipped technical upgrades.',
    '',
    ...formatSkuTable(['watch_local', 'watch_commerce', 'watch_pro'], lang),
    '',
    `## 3. ${isEs ? 'Sitios Web Answer-Ready' : 'Answer-Ready Websites'}`,
    '',
    ...formatSkuTable(['website_quick_fix', 'website_5page', 'website_10page'], lang),
    '',
    `## 4. ${isEs ? 'Packs por Industria' : 'Industry Playbook Packs'}`,
    '',
    ...formatSkuTable(['clinicas_pack', 'law_pack', 'shopify_check'], lang),
    '',
    `## 5. ${isEs ? 'Canal Mayorista para Agencias (Marca Blanca)' : 'Agency White-Label & Wholesale Pricing'}`,
    '',
    ...formatSkuTable(['agency_pilot_audit', 'agency_reaudit', 'watch_agency_client'], lang),
    '',
    ...nextStepsSection(origin, lang),
  ].join('\n');
}

export function renderWatchServicesIndexMarkdown(origin: string, lang: Lang = 'en'): string {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  const title = isEs
    ? 'Servicios de Visibilidad IA y Sitios Web — Sondri Watch'
    : 'AI Visibility Services & Websites — Sondri Watch';
  const description = isEs
    ? 'Explora cada servicio especialista de Sondri Watch: AEO, GEO, ChatGPT SEO, Google AI Overviews, llms.txt & Schema, Reputación IA y Sitios Web desde $390.'
    : 'Explore Sondri Watch specialist services: AEO, GEO, ChatGPT SEO, Google AI Overviews, Perplexity & Gemini, llms.txt & Schema, Citations, and Answer-Ready Websites from $390.';
  const services = getWatchServices(lang);

  return [
    ...frontmatter({ title, description, url: `${origin}${prefix}/services/`, lang }),
    `# ${title}`,
    '',
    description,
    '',
    `## ${isEs ? 'Catálogo de Servicios' : 'Specialist Services'}`,
    '',
    ...services.map(
      (s) =>
        `- **${s.pillar}** — [${s.title}](${origin}${prefix}/services/${s.slug}/) ([Markdown](${origin}${prefix}/services/${s.slug}.md)): ${s.summary}`,
    ),
    '',
    ...nextStepsSection(origin, lang),
  ].join('\n');
}

export function renderWatchServiceDetailMarkdown(
  origin: string,
  service: WatchServiceEntry,
  lang: Lang = 'en',
): string {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  const url = `${origin}${prefix}/services/${service.slug}/`;
  const title = `${service.title} — Sondri Watch`;

  return [
    ...frontmatter({ title, description: service.summary, url, lang }),
    `# ${service.title}`,
    '',
    `**${service.pillar}** — ${service.headline} ${service.headlineAccent}`,
    '',
    service.summary,
    '',
    `## ${isEs ? 'Qué implementamos' : 'What We Ship'}`,
    '',
    ...service.whatWeShip.map((item) => `- ${item}`),
    '',
    `## ${isEs ? 'Opciones y Precios Recomendados' : 'Recommended Plans & Pricing'}`,
    '',
    formatSkuBullet(service.primarySku, lang),
    formatSkuBullet(service.secondarySku, lang),
    '',
    `## ${isEs ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}`,
    '',
    ...service.faqs.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
    ...nextStepsSection(origin, lang),
  ].join('\n');
}

export function renderWatchGuidesIndexMarkdown(origin: string, lang: Lang = 'en'): string {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  const title = isEs
    ? 'Guías Claras y Lecturas Técnicas — Sondri Watch'
    : 'Plain-English AI Search Guides & Technical Reads — Sondri Watch';
  const description = isEs
    ? '8 guías claras sobre AEO, GEO, ChatGPT SEO y costos en 2026, más la lectura técnica profunda de los 4 filtros IA.'
    : '8 plain-English guides to AI visibility, AEO vs GEO vs SEO, measuring ChatGPT answers, and 2026 pricing—plus our 4-Gate technical engineering read.';
  const guides = getWatchGuides(lang);

  return [
    ...frontmatter({ title, description, url: `${origin}${prefix}/guides/`, lang }),
    `# ${title}`,
    '',
    description,
    '',
    `## ${isEs ? 'Guías Disponibles' : 'Published Guides'}`,
    '',
    ...guides.map(
      (g) =>
        `- [${g.title}](${origin}${prefix}/guides/${g.slug}/) (${g.readTime}) — ${g.heroSummary} ([Markdown](${origin}${prefix}/guides/${g.slug}.md))`,
    ),
    '',
    ...nextStepsSection(origin, lang),
  ].join('\n');
}

export function renderWatchGuideDetailMarkdown(
  origin: string,
  guide: WatchGuideEntry,
  lang: Lang = 'en',
): string {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  const url = `${origin}${prefix}/guides/${guide.slug}/`;
  const title = `${guide.title} — Sondri Watch`;

  return [
    ...frontmatter({ title, description: guide.heroSummary, url, lang }),
    `# ${guide.title}`,
    '',
    `> ${guide.heroSummary}`,
    '',
    `*${guide.readTime}*`,
    '',
    `## ${isEs ? 'Ideas Clave' : 'Key Takeaways'}`,
    '',
    ...guide.keyTakeaways.map((k) => `- ${k}`),
    '',
    ...guide.sections.flatMap((sec) => [`## ${sec.heading}`, '', sec.body, '']),
    `## ${guide.checklistTitle}`,
    '',
    ...guide.checklistItems.map((item) => `- [ ] ${item}`),
    '',
    `## ${isEs ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}`,
    '',
    ...guide.faqs.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
    ...nextStepsSection(origin, lang),
  ].join('\n');
}

export function renderWatchPlaybooksMarkdown(origin: string, lang: Lang = 'en'): string {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  const title = isEs
    ? 'Guías Técnicas, Sprints y Packs — Sondri Watch'
    : 'Technical Reads, Fix Sprints & Playbooks — Sondri Watch';
  const description = isEs
    ? 'Guía técnica de los 4 filtros IA, Sprints de pago único ($249–$499) y Packs especializados por industria.'
    : 'Deep-dive technical read on the 4 AI answer gates, one-time implementation sprints ($249–$499), and vertical playbooks.';

  return [
    ...frontmatter({ title, description, url: `${origin}${prefix}/playbooks/`, lang }),
    `# ${title}`,
    '',
    description,
    '',
    `## ${isEs ? 'Arquitectura de los 4 Filtros de Visibilidad IA' : 'The 4 AI Visibility Gates'}`,
    '',
    isEs
      ? '1. **Rastreadores e Infraestructura:** Política `robots.txt` abierta (`OAI-SearchBot`, `PerplexityBot`, `Googlebot`) + TTFB/LCP móvil rápido.\n2. **Grafo de Entidad y Schema:** JSON-LD válido (`Organization` / `LocalBusiness`, `Service`, `FAQPage`) con hechos claros.\n3. **Directorios Oficiales de IA:** Perfiles verificados y coherentes en OpenAI Business Hub, Bing, Apple Business y Google Business Profile.\n4. **Citas y Cuota Semanal:** Menciones externas verificables y seguimiento semanal en sesión limpia.'
      : '1. **AI Crawler & Speed Gate:** Open `robots.txt` rules (`OAI-SearchBot`, `PerplexityBot`, `Googlebot`) + fast mobile TTFB/LCP.\n2. **Entity & Schema Gate:** Validated `Organization` / `LocalBusiness`, `Service`, and `FAQPage` JSON-LD with plain facts.\n3. **Official AI Listings Gate:** Consistent claimed profiles on OpenAI Business Hub, Bing AI Performance, Apple Business Connect, and Google Business Profile.\n4. **Citation & Weekly Answer Share:** External citation coverage + weekly logged-out prompt monitoring.',
    '',
    `## ${isEs ? 'Packs por Industria y Sprints' : 'Industry Packs & One-Time Sprints'}`,
    '',
    formatSkuBullet('clinicas_pack', lang),
    formatSkuBullet('law_pack', lang),
    formatSkuBullet('shopify_check', lang),
    formatSkuBullet('watch_pro', lang),
    formatSkuBullet('listings_sprint', lang),
    formatSkuBullet('fix_sprint', lang),
    '',
    ...nextStepsSection(origin, lang),
  ].join('\n');
}

export function renderWatchPartnersMarkdown(origin: string, lang: Lang = 'en'): string {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  const title = isEs
    ? 'Programa Marca Blanca para Agencias — Sondri Watch'
    : 'Agency White-Label & Wholesale Program — Sondri Watch';
  const description = isEs
    ? 'Agencias web, diseño y SEO: ofrece auditorías AEO marca blanca ($149) y monitoreo mensual ($79/cliente/mes) sin construir infraestructura.'
    : 'For web, design, and local SEO agencies: offer white-label AEO audits ($149 wholesale) and monthly client Watch monitoring ($79/client/mo).';

  return [
    ...frontmatter({ title, description, url: `${origin}${prefix}/partners/`, lang }),
    `# ${title}`,
    '',
    description,
    '',
    `## ${isEs ? 'Tarifas Mayoristas Marca Blanca' : 'Wholesale White-Label SKUs'}`,
    '',
    ...formatSkuTable(['agency_pilot_audit', 'agency_reaudit', 'watch_agency_client'], lang),
    '',
    `## ${isEs ? 'Cómo Funciona para Agencias' : 'How the Agency Program Works'}`,
    '',
    isEs
      ? '- **Tú conservas la relación y tu margen:** Facturas a tu cliente al precio que elijas; Sondri entrega auditorías y reportes listos para marca blanca.\n- **Sin infraestructura propia:** Evitas mantener runners multi-motor, parsing de AI Overviews o comparativas entre olas.\n- **Prueba antes/después:** Incluye re-auditoría comparativa sobre prompts fijos tras implementar tus mejoras.'
      : '- **Keep the client & set your markup:** Bill your clients directly while Sondri delivers ready-to-rebrand audit PDFs and monthly scorecards.\n- **Zero pipeline overhead:** Skip building and maintaining logged-out multi-engine prompt runners.\n- **Before/after verification:** Run identical frozen prompt waves after shipping website or schema fixes.',
    '',
    ...nextStepsSection(origin, lang),
  ].join('\n');
}

export function renderWatchSampleReportMarkdown(origin: string, lang: Lang = 'en'): string {
  const isEs = lang === 'es';
  const prefix = prefixOf(lang);
  const title = isEs
    ? 'Reporte Mensual de Ejemplo — Sondri Watch'
    : 'Sample Monthly Watch Report — Sondri Watch';
  const description = isEs
    ? 'Así se ve el entregable mensual de Sondri Watch: 25 o 75 prompts fijos corridos semanalmente en 4 motores de IA + PDF ejecutivo y 1 mejora implementada.'
    : 'Preview the actual monthly Sondri Watch deliverable: frozen prompt tracking across 4 engines, competitor named-share, and the monthly shipped fix.';

  return [
    ...frontmatter({ title, description, url: `${origin}${prefix}/sample-report/`, lang }),
    `# ${title}`,
    '',
    description,
    '',
    `## ${isEs ? 'Qué Incluye Cada Reporte Mensual' : 'What Every Monthly Report Delivers'}`,
    '',
    isEs
      ? '- **Prompts fijos de comprador en sesión limpia:** 25 prompts (Watch Local), 45 (Commerce) o 75 (Pro) ejecutados semanalmente en ChatGPT, Gemini, Google AI Overviews y Google AI Mode.\n- **Cuota de mención frente a competidores:** Posición exacta en la terna recomendada, enlaces citados y brechas de fuente.\n- **1+ mejora técnica implementada cada mes:** Despliegue continuo de bloques answer-ready, JSON-LD, `llms.txt` y consistencia de perfiles oficiales.'
      : '- **Frozen logged-out buyer prompts:** 25 prompts (Watch Local), 45 (Commerce), or 75 (Pro) tracked weekly across ChatGPT, Gemini, Google AI Overviews, and Google AI Mode.\n- **Competitor named-share matrix:** Exact shortlist rank, cited URLs, and citation gaps vs. named local/category competitors.\n- **Shipped monthly upgrade:** Done-for-you implementation of answer-first blocks, validated JSON-LD, `llms.txt`, and listing alignment.',
    '',
    ...nextStepsSection(origin, lang),
  ].join('\n');
}

export function renderAiAuditMarkdown(origin: string): string {
  const title = 'Free AI Search Visibility (AEO / GEO) Audit — Sondri';
  const description =
    'Check whether ChatGPT, Gemini, and Google AI can crawl your site, inspect your structured data and Lighthouse health, and run 3 unbranded buyer questions.';

  return [
    ...frontmatter({ title, description, url: `${origin}/ai-audit/`, lang: 'en' }),
    `# ${title}`,
    '',
    description,
    '',
    '## What the Free 60-Second Check Tests',
    '',
    '- **AI Crawler Access (`robots.txt`):** Checks whether `OAI-SearchBot`, `GPTBot`, `PerplexityBot`, `Googlebot`, and `ClaudeBot` can crawl your domain.',
    '- **Machine-Readable Discovery:** Verifies `llms.txt`, XML sitemap, and structured JSON-LD (`Organization`, `LocalBusiness`, `Service`, `FAQPage`).',
    '- **Live Mobile Performance:** Runs Google PageSpeed Insights / Core Web Vitals (LCP, INP, CLS) and technical SEO health.',
    '- **3 Unbranded Buyer Prompts:** Tests real buyer discovery questions grounded in live AI search and shows whether your brand is cited or skipped.',
    '',
    '## Upgrade Path',
    '',
    formatSkuBullet('aeo_full_audit', 'en'),
    formatSkuBullet('watch_local', 'en'),
    '',
    ...nextStepsSection(origin, 'en'),
  ].join('\n');
}

export function renderWatchLlmsSection(origin: string): string[] {
  const servicesEn = getWatchServices('en');
  const guidesEn = getWatchGuides('en');

  return [
    '## Sondri Watch — AI Search Visibility (AEO / GEO)',
    '',
    '> Done-for-you AI search visibility monitoring and Answer-Ready websites for local, SaaS, healthcare, legal, and ecommerce businesses across ChatGPT, Gemini, Google AI Overviews, and Google AI Mode.',
    '',
    `- [Free AI Visibility Mini Audit](${origin}/ai-audit/): Instant robots.txt, JSON-LD, Lighthouse, and 3-prompt check ([Markdown](${origin}/ai-audit.md))`,
    `- [Sondri Watch Overview (EN)](${origin}/watch/): Multi-engine tracking, free check, and Answer-Ready websites ([Markdown](${origin}/watch/index.md))`,
    `- [Sondri Watch Resumen (ES)](${origin}/es/watch/): Visibilidad IA en español y sitios web Answer-Ready ([Markdown](${origin}/es/watch/index.md))`,
    `- [Pricing & Plans (EN)](${origin}/watch/pricing/): Full $99 audit, Watch $149–$399/mo, Websites $390–$1,190, Sprints $249–$499 ([Markdown](${origin}/watch/pricing.md))`,
    `- [Precios y Planes (ES)](${origin}/es/watch/pricing/): Auditoría $99, planes Watch $149–$399/mes y Sitios Web desde $390 ([Markdown](${origin}/es/watch/pricing.md))`,
    `- [All Watch Services (EN)](${origin}/watch/services/): Specialist AEO, GEO, schema, citations & websites ([Markdown](${origin}/watch/services/index.md))`,
    `- [Servicios Watch (ES)](${origin}/es/watch/services/): Todos los servicios de visibilidad IA y sitios web ([Markdown](${origin}/es/watch/services/index.md))`,
    `- [Plain-English AI Guides (EN)](${origin}/watch/guides/): 8 guides covering AEO vs GEO, measurement, schema & ROI ([Markdown](${origin}/watch/guides/index.md))`,
    `- [Guías de Visibilidad IA (ES)](${origin}/es/watch/guides/): 8 guías prácticas en español ([Markdown](${origin}/es/watch/guides/index.md))`,
    `- [Industry Playbooks & Fix Sprints (EN)](${origin}/watch/playbooks/) · [ES](${origin}/es/watch/playbooks/) ([Markdown](${origin}/watch/playbooks.md))`,
    `- [Agency White-Label Program (EN)](${origin}/watch/partners/) · [ES](${origin}/es/watch/partners/) ([Markdown](${origin}/watch/partners.md))`,
    `- [Sample Monthly Report (EN)](${origin}/watch/sample-report/) · [ES](${origin}/es/watch/sample-report/) ([Markdown](${origin}/watch/sample-report.md))`,
    '',
    '### Watch Services (EN)',
    '',
    ...servicesEn.map(
      (s) =>
        `- [${s.title}](${origin}/watch/services/${s.slug}/): ${s.cardDesc} ([Markdown](${origin}/watch/services/${s.slug}.md))`,
    ),
    '',
    '### Watch Guides (EN)',
    '',
    ...guidesEn.map(
      (g) =>
        `- [${g.title}](${origin}/watch/guides/${g.slug}/): ${g.cardDesc} ([Markdown](${origin}/watch/guides/${g.slug}.md))`,
    ),
    '',
  ];
}

export function getWatchMarkdownMirrorPaths(origin: string): string[] {
  const enServices = getWatchServices('en').map((s) => `${origin}/watch/services/${s.slug}.md`);
  const esServices = getWatchServices('es').map((s) => `${origin}/es/watch/services/${s.slug}.md`);
  const enGuides = getWatchGuides('en').map((g) => `${origin}/watch/guides/${g.slug}.md`);
  const esGuides = getWatchGuides('es').map((g) => `${origin}/es/watch/guides/${g.slug}.md`);

  return [
    `${origin}/ai-audit.md`,
    `${origin}/watch/index.md`,
    `${origin}/watch/pricing.md`,
    `${origin}/watch/services/index.md`,
    ...enServices,
    `${origin}/watch/guides/index.md`,
    ...enGuides,
    `${origin}/watch/playbooks.md`,
    `${origin}/watch/partners.md`,
    `${origin}/watch/sample-report.md`,
    `${origin}/es/watch/index.md`,
    `${origin}/es/watch/pricing.md`,
    `${origin}/es/watch/services/index.md`,
    ...esServices,
    `${origin}/es/watch/guides/index.md`,
    ...esGuides,
    `${origin}/es/watch/playbooks.md`,
    `${origin}/es/watch/partners.md`,
    `${origin}/es/watch/sample-report.md`,
  ];
}
