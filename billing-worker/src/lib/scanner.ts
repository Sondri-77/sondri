import { AuditLang, BotAccessStatus, LighthouseResult, TechScanResult } from '../types';

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

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
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

function extractAllMatches(html: string, regex: RegExp, limit: number = 6): string[] {
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null && results.length < limit) {
    const cleaned = stripTags(m[1] || '');
    if (cleaned && !results.includes(cleaned)) {
      results.push(cleaned);
    }
  }
  return results;
}

function parseJsonLdSchemas(html: string): string[] {
  const types = new Set<string>();
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;

  const collectTypes = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(collectTypes);
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
      node['@graph'].forEach(collectTypes);
    }
  };

  while ((m = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      collectTypes(parsed);
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  }
  return Array.from(types);
}

function evaluateRobotsTxt(robotsText: string): BotAccessStatus[] {
  if (!robotsText.trim()) {
    return AI_BOTS.map((b) => ({ ...b, allowed: true }));
  }

  const lines = robotsText.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim());
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
  const html = pageRes && pageRes.ok ? await pageRes.text() : '';

  const title = extractMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription =
    extractMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    extractMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const canonical =
    extractMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) || null;

  const h1s = extractAllMatches(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, 4);
  const h2s = extractAllMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi, 8);
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
    /href=["']tel:/i.test(html) || /\+?\d[\d\s().-]{7,}\d/.test(stripTags(html).slice(0, 12000));
  const hasAddressSignals =
    /<address/i.test(html) ||
    /"streetAddress"/i.test(html) ||
    /"addressLocality"/i.test(html);

  const robotsTxtFound = Boolean(robotsRes && robotsRes.ok);
  const robotsText = robotsTxtFound && robotsRes ? await robotsRes.text() : '';
  const bots = evaluateRobotsTxt(robotsText);

  const llmsTxtFound = Boolean(
    llmsRes &&
      llmsRes.ok &&
      (llmsRes.headers.get('content-type') || '').toLowerCase().includes('text/plain')
  );
  const sitemapFound = Boolean(sitemapRes && sitemapRes.ok);

  const detectedBrand =
    (title.split(/[|–—•:-]/)[0] || '').trim() ||
    domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  const inferredService = (userService || '').trim() || h1s[0] || title || domain;
  const inferredCity = (userCity || '').trim();

  // Compute readiness score (0-100) and actionable gaps based on Week 1 guide criteria
  let score = 0;
  const gaps: string[] = [];

  if (reachable && statusCode === 200) {
    score += 20;
  } else {
    gaps.push(
      lang === 'es'
        ? 'No pudimos leer el HTML principal de tu sitio de forma directa (código HTTP no es 200).'
        : 'Could not cleanly fetch your homepage HTML (non-200 status or blocked).'
    );
  }

  const searchBotsAllowed = bots.filter((b) => b.role === 'search').every((b) => b.allowed);
  if (searchBotsAllowed) {
    score += 20;
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
    score += 20;
  } else {
    gaps.push(
      lang === 'es'
        ? 'Falta un título claro, meta descripción o encabezado H1 que explique qué haces y dónde.'
        : 'Missing a clear title tag, meta description, or H1 heading stating what you do and where.'
    );
  }

  if (hasOrganizationOrLocalBusiness) {
    score += 15;
  } else {
    gaps.push(
      lang === 'es'
        ? 'No detectamos datos estructurados (schema) de Organization o LocalBusiness con tus datos oficiales.'
        : 'Missing Organization or LocalBusiness structured data (JSON-LD schema).'
    );
  }

  if (hasFaqSchema) {
    score += 15;
  } else {
    gaps.push(
      lang === 'es'
        ? 'No detectamos schema FAQPage con preguntas reales de clientes fáciles de citar por la IA.'
        : 'No FAQPage structured data found with direct buyer Q&As for AI engines to cite.'
    );
  }

  if (hasPhoneInHtml || hasAddressSignals) {
    score += 5;
  } else {
    gaps.push(
      lang === 'es'
        ? 'No se detectan señales claras de teléfono o dirección/ciudad consistentes en la portada.'
        : 'No clear phone or address/location signals detected in the homepage markup.'
    );
  }

  if (sitemapFound) {
    score += 5;
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
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', targetUrl);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.append('category', 'PERFORMANCE');
  endpoint.searchParams.append('category', 'SEO');
  if (apiKey) {
    endpoint.searchParams.set('key', apiKey);
  }

  const res = await fetchWithTimeout(endpoint.href, 18000);
  if (!res || !res.ok) {
    return {
      fetchedAt: new Date().toISOString(),
      strategy: 'mobile',
      performanceScore: null,
      seoScore: null,
      isCrawlable: null,
      error: res ? `PageSpeed HTTP ${res.status}` : 'PageSpeed timeout',
    };
  }

  const data: any = await res.json();
  const categories = data?.lighthouseResult?.categories || {};
  const audits = data?.lighthouseResult?.audits || {};

  const perfRaw = categories?.performance?.score;
  const seoRaw = categories?.seo?.score;
  const crawlableScore = audits?.['is-crawlable']?.score;

  return {
    fetchedAt: new Date().toISOString(),
    strategy: 'mobile',
    performanceScore: typeof perfRaw === 'number' ? Math.round(perfRaw * 100) : null,
    seoScore: typeof seoRaw === 'number' ? Math.round(seoRaw * 100) : null,
    isCrawlable: typeof crawlableScore === 'number' ? crawlableScore === 1 : null,
    lcpDisplay: audits?.['largest-contentful-paint']?.displayValue || undefined,
    clsDisplay: audits?.['cumulative-layout-shift']?.displayValue || undefined,
  };
}
