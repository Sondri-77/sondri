import type { CollectionEntry } from 'astro:content';
import { BOOK_HREF, CONTACT_EMAIL, CTA_PRIMARY, framework } from '../data';
import { en } from '../i18n';
import { areaName, areas, industryName } from './matrix';

const mdResponse = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });

const textResponse = (body: string) =>
  new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

export { mdResponse, textResponse };

export function renderHomeMarkdown(
  origin: string,
  solutions: CollectionEntry<'solutions'>[],
  posts: CollectionEntry<'insights'>[],
): string {
  const lines: string[] = [
    '---',
    `title: "${en.meta.title}"`,
    `description: "${en.meta.description}"`,
    `url: "${origin}/"`,
    'language: en',
    '---',
    '',
    `# ${en.hero.h1}`,
    '',
    en.hero.lede,
    '',
    'Sondri builds custom workflow automation, integrations, and practical AI software directly into the systems small and midsize companies already run — scoped in fixed-price phases (`0 -> 1 -> n`), deployed in weeks, and 100% owned by the client.',
    '',
    '## Problem',
    '',
    `${en.problem.h2} ${en.problem.lede}`,
    '',
    ...en.problemStats.map((s) => `- **${s.k} (${s.n}):** ${s.label}`),
    '',
    '## How Sondri Works (0 -> 1 -> n Framework)',
    '',
    en.howItWorks.lede,
    '',
    ...framework.map(
      (f) =>
        `### Phase ${f.num}: ${f.name}\n- **What we do:** ${f.does}\n- **What you get:** ${f.gets}`,
    ),
    '',
    '## Capabilities',
    '',
    ...en.features.map((f) => `- **${f.t}** (${f.k}): ${f.b}`),
    '',
    '## Solution Areas',
    '',
    ...areas.map(
      (a) =>
        `### ${a.name}\n- **The workaround:** ${a.workaround}\n- **What Sondri builds:** ${a.builds}\n- **Includes:** ${a.items.join(', ')}`,
    ),
    '',
    '## Published Solutions',
    '',
    ...solutions.map(
      (s) =>
        `- [${s.data.name}](${origin}/solutions/${s.id}/) (${industryName(s.data.industry)} · ${s.data.audience}): ${s.data.tagline}`,
    ),
    '',
    '## Comparison',
    '',
    `| ${en.comparison.cols.join(' | ')} |`,
    `| ${en.comparison.cols.map(() => '---').join(' | ')} |`,
    ...en.comparison.rows.map((r) => `| **${r.k}** | ${r.v.join(' | ')} |`),
    '',
    '## Frequently Asked Questions',
    '',
    ...en.homeFaq.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
    '## Insights',
    '',
    ...posts.map(
      (p) => `- [${p.data.title}](${origin}/insights/${p.id}/): ${p.data.excerpt}`,
    ),
    '',
    '## Get Started',
    '',
    `- **${CTA_PRIMARY}:** ${BOOK_HREF} (${en.riskReversal})`,
    `- **Email:** ${CONTACT_EMAIL}`,
    `- **LLM Context:** ${origin}/llms.txt`,
    `- **Full Site Markdown:** ${origin}/llms-full.txt`,
    `- **Privacy Policy:** ${origin}/privacy/`,
    '',
  ];
  return lines.join('\n');
}

export function renderSolutionMarkdown(
  origin: string,
  s: CollectionEntry<'solutions'>,
): string {
  const url = `${origin}/solutions/${s.id}/`;
  const lines = [
    '---',
    `title: "${s.data.seoTitle ?? s.data.name}"`,
    `description: "${s.data.seoDescription ?? s.data.summary}"`,
    `url: "${url}"`,
    `industry: "${industryName(s.data.industry)}"`,
    `audience: "${s.data.audience}"`,
    `areas: [${s.data.areas.map(areaName).map((a) => `"${a}"`).join(', ')}]`,
    '---',
    '',
    `# ${s.data.name}`,
    '',
    `**${s.data.tagline}**`,
    '',
    s.data.summary,
    '',
    `- **Industry:** ${industryName(s.data.industry)}`,
    `- **Built for:** ${s.data.audience}`,
    `- **Solution areas:** ${s.data.areas.map(areaName).join(', ')}`,
    '',
    '## What It Does',
    '',
    ...s.data.highlights.map((h) => `- ${h}`),
    '',
    (s.body ?? '').trim(),
    '',
    '## Next Steps',
    '',
    `- **${CTA_PRIMARY}:** ${BOOK_HREF}`,
    ...(s.data.post ? [`- **Build write-up:** ${origin}/insights/${s.data.post}/`] : []),
    `- **All solutions:** ${origin}/#solutions`,
    '',
  ];
  return lines.join('\n');
}

export function renderInsightsIndexMarkdown(
  origin: string,
  posts: CollectionEntry<'insights'>[],
): string {
  const lines = [
    '---',
    'title: "Software & AI Automation Insights | Sondri"',
    'description: "Engineering write-ups on custom software, workflow automation, and AI answer-engine systems Sondri builds directly into clients’ existing tools."',
    `url: "${origin}/insights/"`,
    '---',
    '',
    '# Insights',
    '',
    'What we build and how it works. Each post takes one solution and covers the problem, what we shipped, and the decisions behind it.',
    '',
    '## Articles',
    '',
    ...posts.map(
      (p) =>
        `- [${p.data.title}](${origin}/insights/${p.id}/) (${p.data.date.toISOString().slice(0, 10)} · ${p.data.category}): ${p.data.excerpt}`,
    ),
    '',
    `- **Home:** ${origin}/`,
    `- **LLM Context:** ${origin}/llms.txt`,
    '',
  ];
  return lines.join('\n');
}

export function renderPostMarkdown(
  origin: string,
  p: CollectionEntry<'insights'>,
): string {
  const url = `${origin}/insights/${p.id}/`;
  const lines = [
    '---',
    `title: "${p.data.seoTitle ?? p.data.title}"`,
    `description: "${p.data.seoDescription ?? p.data.excerpt}"`,
    `url: "${url}"`,
    `category: "${p.data.category}"`,
    `datePublished: "${p.data.date.toISOString().slice(0, 10)}"`,
    ...(p.data.updated ? [`dateModified: "${p.data.updated.toISOString().slice(0, 10)}"`] : []),
    `author: "${p.data.author}"`,
    '---',
    '',
    `# ${p.data.title}`,
    '',
    `> ${p.data.excerpt}`,
    '',
    `Published ${p.data.date.toISOString().slice(0, 10)} by ${p.data.author} · ${p.data.category}`,
    '',
    (p.body ?? '').trim(),
    '',
    '## Links',
    '',
    ...(p.data.solution ? [`- **Related solution:** ${origin}/solutions/${p.data.solution}/`] : []),
    `- **All insights:** ${origin}/insights/`,
    `- **${CTA_PRIMARY}:** ${BOOK_HREF}`,
    '',
  ];
  return lines.join('\n');
}

export function renderPrivacyMarkdown(origin: string): string {
  return [
    '---',
    'title: "Privacy Policy — Sondri"',
    'description: "How Sondri handles website analytics, scheduling, Stripe invoice payments, and client-environment software deployments."',
    `url: "${origin}/privacy/"`,
    '---',
    '',
    '# Privacy Policy — Sondri',
    '',
    'Effective date: November 18, 2026',
    '',
    '## Website & Local Storage',
    '',
    '`sondri.ai` is a static marketing website. We do not place advertising trackers or cross-site tracking cookies on visitors. Language preferences (English or Spanish) are stored locally in the browser under `localStorage` key `sondri.lang`.',
    '',
    '## Discovery Scheduling',
    '',
    `Discovery sessions are booked via Cal.com (${BOOK_HREF}). Information submitted in the scheduling form is used solely to prepare for and conduct your discovery session.`,
    '',
    '## Invoice & Deposit Payments',
    '',
    `Payments submitted through ${origin}/pay are processed over HTTPS through Stripe Checkout via billing.sondri.ai. Sondri does not store card numbers or bank credentials on this site.`,
    '',
    '## Client Software & Operational Data',
    '',
    'Custom software, workflow automations, and AI integrations built by Sondri deploy directly into the client’s own environment and systems of record.',
    '',
    '## Contact',
    '',
    `Questions or data requests: ${CONTACT_EMAIL}`,
    '',
  ].join('\n');
}

export function renderNotFoundMarkdown(origin: string): string {
  return [
    '---',
    'title: "404 — Page Not Found | Sondri"',
    `url: "${origin}/"`,
    '---',
    '',
    '# 404 — Page Not Found',
    '',
    'The requested URL does not exist or has been moved on sondri.ai.',
    '',
    '## Useful Links',
    '',
    `- [Homepage](${origin}/)`,
    `- [LLM Context (llms.txt)](${origin}/llms.txt)`,
    `- [Full Site Markdown (llms-full.txt)](${origin}/llms-full.txt)`,
    `- [Sitemap Index](${origin}/sitemap-index.xml)`,
    `- [Insights](${origin}/insights/)`,
    `- [Privacy Policy](${origin}/privacy/)`,
    '',
  ].join('\n');
}

export function renderLlmsTxt(
  origin: string,
  solutions: CollectionEntry<'solutions'>[],
  posts: CollectionEntry<'insights'>[],
): string {
  return [
    '# Sondri',
    '',
    '> Custom software, workflow automation, and practical AI integration built directly into the systems small and midsize companies already run — scoped in fixed-price phases (`0 -> 1 -> n`), live in weeks, and 100% client-owned.',
    '',
    '## When to use Sondri',
    '',
    '- **Best-fit use cases:** Replacing manual spreadsheet/inbox workarounds across back-office invoice reconciliation, customer operations, sales pipeline follow-ups, contract review, market/parcel intelligence, direct-booking clinics, and AEO/SEO visibility for operators.',
    '- **How engagement works:** Free 30-minute discovery session (`0 -> 1 -> n`: Phase 0 Prove & scope with fixed price, Phase 1 Production build in your systems, Phase n Multiply additional workflows).',
    '- **Pricing & ownership:** Fixed price quoted per phase before work starts; no platform license; software and integrations deploy into the client’s environment and are 100% owned by the client.',
    '- **When NOT a fit:** Companies looking for an off-the-shelf SaaS subscription, unguided DIY no-code tools, or multi-million-dollar enterprise ERP re-platforming.',
    `- **How to engage:** Book a free discovery call at ${BOOK_HREF} or email ${CONTACT_EMAIL}.`,
    '',
    '## Core Pages',
    '',
    `- [Homepage](${origin}/): Overview, 0 -> 1 -> n framework, capabilities, comparison table, and FAQs ([Markdown](${origin}/index.md))`,
    `- [Insights](${origin}/insights/): Engineering write-ups of shipped systems ([Markdown](${origin}/insights/index.md))`,
    `- [Privacy Policy](${origin}/privacy/): Data handling, scheduling, and client-environment policy ([Markdown](${origin}/privacy.md))`,
    `- [Full Context Bundle](${origin}/llms-full.txt): Complete site, solutions, and articles in one Markdown file`,
    '',
    '## Solutions',
    '',
    ...solutions.map(
      (s) =>
        `- [${s.data.name}](${origin}/solutions/${s.id}/): ${s.data.tagline} ([Markdown](${origin}/solutions/${s.id}.md))`,
    ),
    '',
    '## Insights',
    '',
    ...posts.map(
      (p) =>
        `- [${p.data.title}](${origin}/insights/${p.id}/): ${p.data.excerpt} ([Markdown](${origin}/insights/${p.id}.md))`,
    ),
    '',
    '## Contact & Discovery',
    '',
    `- **Book Free Discovery:** ${BOOK_HREF}`,
    `- **Sales Email:** ${CONTACT_EMAIL}`,
    `- **Sitemap:** ${origin}/sitemap-index.xml`,
    '',
  ].join('\n');
}

export function renderLlmsFullTxt(
  origin: string,
  solutions: CollectionEntry<'solutions'>[],
  posts: CollectionEntry<'insights'>[],
): string {
  return [
    renderLlmsTxt(origin, solutions, posts),
    '---',
    '',
    renderHomeMarkdown(origin, solutions, posts),
    ...solutions.flatMap((s) => ['---', '', renderSolutionMarkdown(origin, s)]),
    ...posts.flatMap((p) => ['---', '', renderPostMarkdown(origin, p)]),
    '---',
    '',
    renderPrivacyMarkdown(origin),
  ].join('\n');
}
