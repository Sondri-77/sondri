import { AuditLang, BotAccessStatus, LighthouseResult, TechScanResult } from '../types';

const MAX_HTML_BYTES = 512 * 1024;
const MAX_ROBOTS_BYTES = 64 * 1024;
const MAX_ROBOTS_LINES = 2000;
const MAX_JSONLD_BLOCKS = 25;
const MAX_JSONLD_BLOCK_CHARS = 64 * 1024;
const MAX_JSONLD_DEPTH = 16;

const AI_BOTS: { bot: string; role: 'search' | 'training' }[] = [
  { bot: 'OAI-SearchBot', role: 'search' },
  { bot: 'Googlebot', role: 'search' },
  { bot: 'PerplexityBot', role: 'search' },
  { bot: 'Claude-SearchBot', role: 'search' },
  { bot: 'GPTBot', role: 'training' },
  { bot: 'Google-Extended', role: 'training' },
];

export function normalizeInputUrl(raw: string): { url: string; origin: string; domain: string } {
  let trimmed = (raw || '').trim();
  if (!trimmed) {
    throw new Error('Please enter a valid website URL.');
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  const parsed = new URL(trimmed);
  const host = parsed.hostname.toLowerCase();

  // Basic SSRF protection: reject localhost, loopback, and private IP ranges
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === '0.0.0.0' ||
    !host.includes('.')
  ) {
    throw new Error('Please enter a public website domain (e.g. yourcompany.com).');
  }

  const domain = host.replace(/^www\./, '');
  return {
    url: parsed.href,
    origin: parsed.origin,
    domain,
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number = 6500): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SondriAEOBot/1.0; +https://sondri.ai)',
        Accept: 'text/html,text/plain,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function readResponseTextWithLimit(res: Response | null, maxBytes: number): Promise<string> {
  if (!res) return '';
  if (!res.body || typeof res.body.getReader !== 'function') {
    const text = await res.text();
    return text.length > maxBytes ? text.slice(0, maxBytes) : text;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: false });
  const parts: string[] = [];
  let totalBytes = 0;

  try {
    while (totalBytes < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      const remaining = maxBytes - totalBytes;
      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
      totalBytes += chunk.byteLength;
      parts.push(decoder.decode(chunk, { stream: true }));
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  parts.push(decoder.decode());
  return parts.join('');
}

function isTagBoundary(ch: string | undefined): boolean {
  return !ch || /[\s>/]/.test(ch);
}

function stripElementBlocks(html: string, tagName: string): string {
  const lower = html.toLowerCase();
  const openToken = `<${tagName}`;
  const closeToken = `</${tagName}>`;
  let cursor = 0;
  let out = '';

  while (cursor < html.length) {
    const startIdx = lower.indexOf(openToken, cursor);
    if (startIdx === -1) {
      out += html.slice(cursor);
      break;
    }

    if (!isTagBoundary(html[startIdx + openToken.length])) {
      out += html.slice(cursor, startIdx + openToken.length);
      cursor = startIdx + openToken.length;
      continue;
    }

    out += html.slice(cursor, startIdx);
    const openEndIdx = html.indexOf('>', startIdx + openToken.length);
    if (openEndIdx === -1) {
      break;
    }

    const closeIdx = lower.indexOf(closeToken, openEndIdx + 1);
    if (closeIdx === -1) {
      out += ' ';
      break;
    }

    out += ' ';
    cursor = closeIdx + closeToken.length;
  }

  return out;
}

function extractTagContents(html: string, tagName: string, limit: number): string[] {
  const results: string[] = [];
  const lower = html.toLowerCase();
  const openToken = `<${tagName}`;
  const closeToken = `</${tagName}>`;
  let cursor = 0;

  while (cursor < html.length && results.length < limit) {
    const startIdx = lower.indexOf(openToken, cursor);
    if (startIdx === -1) break;

    if (!isTagBoundary(html[startIdx + openToken.length])) {
      cursor = startIdx + openToken.length;
      continue;
    }

    const openEndIdx = html.indexOf('>', startIdx + openToken.length);
    if (openEndIdx === -1) break;

    const closeIdx = lower.indexOf(closeToken, openEndIdx + 1);
    if (closeIdx === -1) {
      // Stop on first unclosed tag to guarantee strictly linear O(N) runtime
      break;
    }

    const cleaned = stripTags(html.slice(openEndIdx + 1, closeIdx));
    if (cleaned && !results.includes(cleaned)) {
      results.push(cleaned);
    }
    cursor = closeIdx + closeToken.length;
  }

  return results;
}

export function stripTags(html: string): string {
  const withoutBlocks = stripElementBlocks(stripElementBlocks(html, 'script'), 'style');
  return withoutBlocks
    .replace(/<[^>]*>?/g, ' ')
    .replace(/[<>]/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMatch(html: string, regex: RegExp): string {
  const m = html.match(regex);
  return m && m[1] ? stripTags(m[1]) : '';
}

function parseJsonLdSchemas(html: string): string[] {
  const types = new Set<string>();
  const lower = html.toLowerCase();
  const openToken = '<script';
  const closeToken = '</script>';
  let cursor = 0;
  let blocksScanned = 0;

  const collectTypes = (node: any, depth: number = 0) => {
    if (!node || typeof node !== 'object' || depth > MAX_JSONLD_DEPTH) return;
    if (Array.isArray(node)) {
      for (const item of node) {
        collectTypes(item, depth + 1);
      }
      return;
    }
    if (node['@type']) {
      if (Array.isArray(node['@type'])) {
        node['@type'].forEach((t: any) => typeof t === 'string' && types.add(t));
      } else if (typeof node['@type'] === 'string') {
        types.add(node['@type']);
      }
    }
    if (Array.isArray(node['@graph'])) {
      collectTypes(node['@graph'], depth + 1);
    }
  };

  while (cursor < html.length && blocksScanned < MAX_JSONLD_BLOCKS) {
    const startIdx = lower.indexOf(openToken, cursor);
    if (startIdx === -1) break;

    if (!isTagBoundary(html[startIdx + openToken.length])) {
      cursor = startIdx + openToken.length;
      continue;
    }

    const openEndIdx = html.indexOf('>', startIdx + openToken.length);
    if (openEndIdx === -1) break;

    const closeIdx = lower.indexOf(closeToken, openEndIdx + 1);
    if (closeIdx === -1) break;

    const openingTag = html.slice(startIdx, openEndIdx + 1);
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(openingTag)) {
      blocksScanned++;
      const jsonBody = html.slice(openEndIdx + 1, closeIdx).trim();
      if (jsonBody && jsonBody.length <= MAX_JSONLD_BLOCK_CHARS) {
        try {
          const parsed = JSON.parse(jsonBody);
          collectTypes(parsed, 0);
        } catch {
          // Ignore malformed JSON-LD blocks
        }
      }
    }

    cursor = closeIdx + closeToken.length;
  }
  return Array.from(types);
}

function evaluateRobotsTxt(robotsText: string): BotAccessStatus[] {
  if (!robotsText.trim()) {
    return AI_BOTS.map((b) => ({ ...b, allowed: true }));
  }

  const lines = robotsText.split(/\r?\n/, MAX_ROBOTS_LINES).map((l) => l.replace(/#.*$/, '').trim());
  const rulesByAgent = new Map<string, { allow: string[]; disallow: string[] }>();
  let currentAgents: string[] = [];

  for (const line of lines) {
    if (!line) {
      currentAgents = [];
      continue;
    }
    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.trim().toLowerCase();
    const val = rest.join(':').trim();

    if (key === 'user-agent') {
      const ua = val.toLowerCase();
      currentAgents.push(ua);
      if (!rulesByAgent.has(ua)) {
        rulesByAgent.set(ua, { allow: [], disallow: [] });
      }
    } else if ((key === 'disallow' || key === 'allow') && currentAgents.length > 0) {
      for (const ua of currentAgents) {
        const bucket = rulesByAgent.get(ua);
        if (bucket) {
          bucket[key].push(val);
        }
      }
    }
  }

  const isBlocked = (botName: string): boolean => {
    const specific = rulesByAgent.get(botName.toLowerCase());
    const wildcard = rulesByAgent.get('*');
    const target = specific || wildcard;
    if (!target) return false;
    const blocksRoot = target.disallow.some((d) => d === '/' || d === '/*');
    const allowsRoot = target.allow.some((a) => a === '/' || a === '/*');
    return blocksRoot && !allowsRoot;
  };

  return AI_BOTS.map((b) => ({
    ...b,
    allowed: !isBlocked(b.bot),
  }));
}

export async function runTechnicalScan(
  rawUrl: string,
  lang: AuditLang,
  userCity?: string,
  userService?: string
): Promise<TechScanResult> {
  const { url, origin, domain } = normalizeInputUrl(rawUrl);

  const [pageRes, robotsRes, llmsRes, sitemapRes] = await Promise.all([
    fetchWithTimeout(url, 6500),
    fetchWithTimeout(`${origin}/robots.txt`, 4500),
    fetchWithTimeout(`${origin}/llms.txt`, 4500),
    fetchWithTimeout(`${origin}/sitemap.xml`, 4500),
  ]);

  const reachable = Boolean(pageRes && pageRes.status < 500);
  const statusCode = pageRes ? pageRes.status : 0;
  let html = '';
  if (pageRes && pageRes.ok) {
    html = await readResponseTextWithLimit(pageRes, MAX_HTML_BYTES);
  } else {
    pageRes?.body?.cancel().catch(() => {});
  }

  const title = extractTagContents(html, 'title', 1)[0] || '';
  const metaDescription =
    extractMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    extractMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const canonical =
    extractMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) || null;

  const h1s = extractTagContents(html, 'h1', 4);
  const h2s = extractTagContents(html, 'h2', 8);
  const bodyExcerpt = stripTags(
    stripElementBlocks(stripElementBlocks(stripElementBlocks(html, 'header'), 'nav'), 'footer')
  ).slice(0, 2500);
  const schemasFound = parseJsonLdSchemas(html);

  const orgLikeTypes = [
    'Organization',
    'LocalBusiness',
    'ProfessionalService',
    'Corporation',
    'MedicalBusiness',
    'Dentist',
    'LegalService',
    'RealEstateAgent',
    'Store',
    'SoftwareApplication',
  ];
  const hasOrganizationOrLocalBusiness = schemasFound.some((t) =>
    orgLikeTypes.some((o) => t.toLowerCase().includes(o.toLowerCase()))
  );
  const hasFaqSchema = schemasFound.some((t) => t.toLowerCase().includes('faqpage'));

  const hasPhoneInHtml =
    /href=["']tel:/i.test(html) || /\+?\d[\d\s().-]{7,}\d/.test(stripTags(html.slice(0, 65536)).slice(0, 12000));
  const hasAddressSignals =
    /<address/i.test(html) ||
    /"streetAddress"/i.test(html) ||
    /"addressLocality"/i.test(html);

  const robotsTxtFound = Boolean(robotsRes && robotsRes.ok);
  let robotsText = '';
  if (robotsTxtFound && robotsRes) {
    robotsText = await readResponseTextWithLimit(robotsRes, MAX_ROBOTS_BYTES);
  } else {
    robotsRes?.body?.cancel().catch(() => {});
  }
  const bots = evaluateRobotsTxt(robotsText);

  const llmsTxtFound = Boolean(
    llmsRes &&
      llmsRes.ok &&
      (llmsRes.headers.get('content-type') || '').toLowerCase().includes('text/plain')
  );
  llmsRes?.body?.cancel().catch(() => {});
  const sitemapFound = Boolean(sitemapRes && sitemapRes.ok);
  sitemapRes?.body?.cancel().catch(() => {});

  const detectedBrand =
    (title.split(/[|–—•:-]/)[0] || '').trim() ||
    domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  const inferredService = (userService || '').trim() || h1s[0] || title || domain;
  const inferredCity = (userCity || '').trim();

  // Compute base technical readiness score (max 45 pts; remaining 55 pts come from live AI visibility)
  let score = 0;
  const gaps: string[] = [];

  if (reachable && statusCode === 200) {
    score += 10;
  } else {
    gaps.push(
      lang === 'es'
        ? 'No pudimos leer el HTML principal de tu sitio de forma directa (código HTTP no es 200).'
        : 'Could not cleanly fetch your homepage HTML (non-200 status or blocked).'
    );
  }

  const searchBotsAllowed = bots.filter((b) => b.role === 'search').every((b) => b.allowed);
  if (searchBotsAllowed) {
    score += 10;
  } else {
    const blockedNames = bots
      .filter((b) => b.role === 'search' && !b.allowed)
      .map((b) => b.bot)
      .join(', ');
    gaps.push(
      lang === 'es'
        ? `Tu archivo robots.txt bloquea rastreadores de búsqueda de IA (${blockedNames}).`
        : `Your robots.txt blocks AI search crawlers (${blockedNames}).`
    );
  }

  if (title && metaDescription && h1s.length > 0) {
    score += 10;
  } else {
    gaps.push(
      lang === 'es'
        ? 'Falta un título claro, meta descripción o encabezado H1 que explique qué haces y dónde.'
        : 'Missing a clear title tag, meta description, or H1 heading stating what you do and where.'
    );
  }

  if (hasOrganizationOrLocalBusiness) {
    score += 5;
  } else {
    gaps.push(
      lang === 'es'
        ? 'No detectamos datos estructurados (schema) de Organization o LocalBusiness con tus datos oficiales.'
        : 'Missing Organization or LocalBusiness structured data (JSON-LD schema).'
    );
  }

  if (hasFaqSchema) {
    score += 5;
  } else {
    gaps.push(
      lang === 'es'
        ? 'No detectamos schema FAQPage con preguntas reales de clientes fáciles de citar por la IA.'
        : 'No FAQPage structured data found with direct buyer Q&As for AI engines to cite.'
    );
  }

  if (hasPhoneInHtml || hasAddressSignals) {
    score += 3;
  } else {
    gaps.push(
      lang === 'es'
        ? 'No se detectan señales claras de teléfono o dirección/ciudad consistentes en la portada.'
        : 'No clear phone or address/location signals detected in the homepage markup.'
    );
  }

  if (sitemapFound) {
    score += 2;
  }

  return {
    url,
    domain,
    reachable,
    statusCode,
    title,
    metaDescription,
    canonical,
    h1s,
    h2s,
    bodyExcerpt,
    detectedBrand,
    inferredService,
    inferredCity,
    schemasFound,
    hasOrganizationOrLocalBusiness,
    hasFaqSchema,
    hasPhoneInHtml,
    hasAddressSignals,
    robotsTxtFound,
    bots,
    llmsTxtFound,
    sitemapFound,
    readinessScore: Math.min(100, score),
    gaps,
  };
}

export async function fetchLighthouseResult(
  targetUrl: string,
  apiKey?: string
): Promise<LighthouseResult> {
  const endpoint = new URL('https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', targetUrl);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.append('category', 'PERFORMANCE');
  endpoint.searchParams.append('category', 'SEO');
  endpoint.searchParams.append('category', 'ACCESSIBILITY');
  endpoint.searchParams.append('category', 'BEST_PRACTICES');
  if (apiKey && !apiKey.startsWith('AIzaSy...')) {
    endpoint.searchParams.set('key', apiKey);
  }

  const res = await fetchWithTimeout(endpoint.href, 45000);
  if (!res || !res.ok) {
    let errDetail = res ? `PageSpeed HTTP ${res.status}` : 'PageSpeed timeout';
    if (res) {
      try {
        const errJson: any = await res.json();
        if (errJson?.error?.message) {
          errDetail = `PageSpeed HTTP ${res.status}: ${errJson.error.message}`;
        }
      } catch {
        // ignore JSON parse error
      }
    }
    return {
      fetchedAt: new Date().toISOString(),
      strategy: 'mobile',
      performanceScore: null,
      seoScore: null,
      accessibilityScore: null,
      bestPracticesScore: null,
      isCrawlable: null,
      error: errDetail,
    };
  }

  const data: any = await res.json();
  const categories = data?.lighthouseResult?.categories || {};
  const audits = data?.lighthouseResult?.audits || {};

  const perfRaw = categories?.performance?.score;
  const seoRaw = categories?.seo?.score;
  const a11yRaw = categories?.accessibility?.score;
  const bpRaw = categories?.['best-practices']?.score;
  const crawlableScore = audits?.['is-crawlable']?.score;

  // Collect actionable Lighthouse opportunities & diagnostics that scored < 0.9
  const priorityAuditIds = [
    'render-blocking-resources',
    'unused-javascript',
    'unused-css-rules',
    'modern-image-formats',
    'uses-optimized-images',
    'uses-Responsive-images',
    'server-response-time',
    'unminified-javascript',
    'unminified-css',
    'meta-description',
    'document-title',
    'image-alt',
    'link-text',
    'crawlable-anchors',
    'is-crawlable',
    'robots-txt',
    'canonical',
    'color-contrast',
    'heading-order',
    'tap-targets',
  ];

  const diagnostics: { id: string; title: string; displayValue?: string; score: number }[] = [];
  for (const id of priorityAuditIds) {
    const a = audits?.[id];
    if (a && typeof a.score === 'number' && a.score < 0.9 && a.title) {
      diagnostics.push({
        id,
        title: String(a.title),
        displayValue: a.displayValue ? String(a.displayValue) : undefined,
        score: Math.round(a.score * 100),
      });
    }
    if (diagnostics.length >= 8) break;
  }

  return {
    fetchedAt: new Date().toISOString(),
    strategy: 'mobile',
    performanceScore: typeof perfRaw === 'number' ? Math.round(perfRaw * 100) : null,
    seoScore: typeof seoRaw === 'number' ? Math.round(seoRaw * 100) : null,
    accessibilityScore: typeof a11yRaw === 'number' ? Math.round(a11yRaw * 100) : null,
    bestPracticesScore: typeof bpRaw === 'number' ? Math.round(bpRaw * 100) : null,
    isCrawlable: typeof crawlableScore === 'number' ? crawlableScore === 1 : null,
    fcpDisplay: audits?.['first-contentful-paint']?.displayValue || undefined,
    lcpDisplay: audits?.['largest-contentful-paint']?.displayValue || undefined,
    tbtDisplay: audits?.['total-blocking-time']?.displayValue || undefined,
    clsDisplay: audits?.['cumulative-layout-shift']?.displayValue || undefined,
    siDisplay: audits?.['speed-index']?.displayValue || undefined,
    ttfbDisplay: audits?.['server-response-time']?.displayValue || undefined,
    diagnostics,
  };
}
