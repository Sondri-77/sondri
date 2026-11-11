import {
  AiVisibilityResult,
  AuditLang,
  GroundedPromptRun,
  TechScanResult,
} from '../types';

const GEMINI_MODEL = 'gemini-2.5-flash';

export function buildFallbackQuestions(
  service: string,
  city: string,
  lang: AuditLang,
  count: number = 3
): string[] {
  const cleanService = (service || (lang === 'es' ? 'servicios profesionales' : 'business services')).trim();
  const cleanCity = (city || (lang === 'es' ? 'Chile' : 'my area')).trim();

  const esPool = [
    `¿Qué empresa de ${cleanService} recomiendas en ${cleanCity}?`,
    `¿Cuáles son las mejores opciones de ${cleanService} en ${cleanCity} para empresas?`,
    `¿Cómo elegir un proveedor confiable de ${cleanService} en ${cleanCity} y cuáles destacan?`,
    `¿Qué empresas ofrecen ${cleanService} con buenas referencias en ${cleanCity}?`,
    `Comparativa de proveedores de ${cleanService} en ${cleanCity}`,
    `¿A quién contratar para ${cleanService} en ${cleanCity}?`,
    `Mejores agencias o especialistas en ${cleanService} en ${cleanCity}`,
    `¿Qué alternativas existen de ${cleanService} en ${cleanCity}?`,
    `Empresas recomendadas de ${cleanService} cerca de ${cleanCity}`,
    `¿Cuánto cuesta y quién ofrece ${cleanService} en ${cleanCity}?`,
    `Especialistas en ${cleanService} para pymes en ${cleanCity}`,
    `¿Qué proveedor de ${cleanService} en ${cleanCity} tiene mejor reputación?`,
  ];

  const enPool = [
    `Which ${cleanService} company do you recommend in ${cleanCity}?`,
    `What are the best ${cleanService} providers in ${cleanCity}?`,
    `Who are the top-rated ${cleanService} businesses in ${cleanCity} and why?`,
    `How do I choose a reliable ${cleanService} provider in ${cleanCity}?`,
    `Compare the leading ${cleanService} companies serving ${cleanCity}`,
    `Who should a small business hire for ${cleanService} in ${cleanCity}?`,
    `Most trusted ${cleanService} specialists in ${cleanCity}`,
    `Best local ${cleanService} options near ${cleanCity}`,
    `Which ${cleanService} firms in ${cleanCity} have the strongest reputation?`,
    `What companies offer ${cleanService} in ${cleanCity} with proven results?`,
    `Top ${cleanService} recommendations for businesses in ${cleanCity}`,
    `Who are the best alternatives for ${cleanService} in ${cleanCity}?`,
  ];

  const pool = lang === 'es' ? esPool : enPool;
  return pool.slice(0, count);
}

export async function inferContextAndBuyerQuestions(
  scan: TechScanResult,
  lang: AuditLang,
  userCity?: string,
  userService?: string,
  apiKey?: string,
  count: number = 3
): Promise<{ service: string; city: string; questions: string[] }> {
  const fallbackService =
    (userService || '').trim() ||
    scan.h1s[0] ||
    scan.title.split(/[|–—•:-]/)[0]?.trim() ||
    (lang === 'es' ? 'servicios profesionales' : 'professional services');
  const fallbackCity =
    (userCity || '').trim() || (lang === 'es' ? 'Chile' : 'United States');

  if (!apiKey || apiKey.startsWith('AIzaSy...')) {
    return {
      service: fallbackService,
      city: fallbackCity,
      questions: buildFallbackQuestions(fallbackService, fallbackCity, lang, count),
    };
  }

  const prompt =
    lang === 'es'
      ? `Analiza los siguientes metadatos de un sitio web y devuelve SOLO un objeto JSON válido sin bloques markdown.
Dominio: ${scan.domain}
Marca detectada (NUNCA la menciones en las preguntas): ${scan.detectedBrand}
Título: ${scan.title}
Meta descripción: ${scan.metaDescription}
H1s: ${scan.h1s.join(' | ')}
H2s: ${scan.h2s.join(' | ')}
Servicio indicado por el usuario: ${userService || '(inferir del sitio)'}
Ciudad/país indicado por el usuario: ${userCity || '(inferir del sitio o usar Chile)'}

Genera exactamente ${count} preguntas reales de compra que haría un cliente en ChatGPT o Gemini buscando este servicio en esa ubicación, SIN nombrar la marca "${scan.detectedBrand}" ni el dominio "${scan.domain}".
Formato JSON exacto:
{"service":"...","city":"...","questions":["..."]}`
      : `Analyze the following website metadata and return ONLY a valid JSON object without markdown fences.
Domain: ${scan.domain}
Detected brand (NEVER name this brand in the questions): ${scan.detectedBrand}
Title: ${scan.title}
Meta description: ${scan.metaDescription}
H1s: ${scan.h1s.join(' | ')}
H2s: ${scan.h2s.join(' | ')}
User-provided service: ${userService || '(infer from site)'}
User-provided city/location: ${userCity || '(infer from site or use United States)'}

Generate exactly ${count} realistic unbranded buyer questions a customer would ask ChatGPT or Gemini when looking to hire/buy this service in that location, WITHOUT naming "${scan.detectedBrand}" or "${scan.domain}".
Exact JSON format:
{"service":"...","city":"...","questions":["..."]}`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      return {
        service: fallbackService,
        city: fallbackCity,
        questions: buildFallbackQuestions(fallbackService, fallbackCity, lang, count),
      };
    }

    const data: any = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(rawText);

    const service = (userService || parsed.service || fallbackService).trim();
    const city = (userCity || parsed.city || fallbackCity).trim();
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions
          .map((q: any) => String(q || '').trim())
          .filter(Boolean)
          .slice(0, count)
      : [];

    if (questions.length === 0) {
      return {
        service,
        city,
        questions: buildFallbackQuestions(service, city, lang, count),
      };
    }

    return { service, city, questions };
  } catch {
    return {
      service: fallbackService,
      city: fallbackCity,
      questions: buildFallbackQuestions(fallbackService, fallbackCity, lang, count),
    };
  }
}

function extractCompetitorsFromAnswer(
  text: string,
  ownBrand: string,
  ownDomain: string
): string[] {
  const candidates = new Set<string>();
  const ownLower = ownBrand.toLowerCase();
  const domLower = ownDomain.toLowerCase().replace(/\.[a-z.]+$/, '');

  // Match bolded names like **Company Name** or numbered/bulleted headings
  const boldRegex = /\*\*([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.,' -]{2,42})\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = boldRegex.exec(text)) !== null && candidates.size < 6) {
    const item = m[1].trim().replace(/[:.-]+$/, '');
    const lower = item.toLowerCase();
    if (
      item.length >= 3 &&
      !lower.includes(ownLower) &&
      !lower.includes(domLower) &&
      !/^(pros|cons|note|summary|key|why|how|step|paso|resumen|ventajas|precio|ubicaci)/i.test(item)
    ) {
      candidates.add(item);
    }
  }
  return Array.from(candidates);
}

async function runSingleGeminiGroundedPrompt(
  question: string,
  scan: TechScanResult,
  lang: AuditLang,
  apiKey: string
): Promise<GroundedPromptRun> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const systemInstruction =
    lang === 'es'
      ? 'Responde como a un comprador real buscando opciones concretas. Nombra empresas o proveedores reales y específicos y sé directo.'
      : 'Answer as you would to a real buyer looking for specific providers. Name concrete businesses or providers and be concise.';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: question }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Gemini Grounded Error] HTTP ${res.status}: ${errText.slice(0, 200)}`);
      return {
        question,
        engine: 'gemini',
        status: 'not_run',
        brandNamed: false,
        domainCited: false,
        competitorsNamed: [],
        sourcesCited: [],
        answerExcerpt:
          lang === 'es'
            ? 'No ejecutado (el motor no respondió en este intento).'
            : 'Not run (engine did not return an answer on this attempt).',
      };
    }

    const data: any = await res.json();
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const fullText = parts.map((p: any) => p.text || '').join('\n').trim();

    if (!fullText) {
      return {
        question,
        engine: 'gemini',
        status: 'not_run',
        brandNamed: false,
        domainCited: false,
        competitorsNamed: [],
        sourcesCited: [],
        answerExcerpt:
          lang === 'es'
            ? 'No ejecutado (respuesta vacía).'
            : 'Not run (empty response).',
      };
    }

    const groundingChunks: any[] =
      candidate?.groundingMetadata?.groundingChunks || [];
    const sourcesCited: { title: string; url: string; domain: string }[] = [];
    const seenUrls = new Set<string>();

    for (const chunk of groundingChunks) {
      const uri = chunk?.web?.uri;
      const title = chunk?.web?.title || '';
      if (uri && !seenUrls.has(uri)) {
        seenUrls.add(uri);
        let chunkDomain = title;
        try {
          const parsedUrl = new URL(uri);
          chunkDomain = parsedUrl.hostname.replace(/^www\./, '');
        } catch {
          // keep title fallback
        }
        sourcesCited.push({
          title: title || chunkDomain,
          url: uri,
          domain: chunkDomain,
        });
      }
    }

    const lowerText = fullText.toLowerCase();
    const brandSlug = scan.domain.split('.')[0].toLowerCase();
    const brandNameLower = scan.detectedBrand.toLowerCase();

    const brandNamed =
      lowerText.includes(scan.domain.toLowerCase()) ||
      (brandNameLower.length >= 3 && lowerText.includes(brandNameLower)) ||
      (brandSlug.length >= 4 && lowerText.includes(brandSlug));

    const domainCited =
      lowerText.includes(scan.domain.toLowerCase()) ||
      sourcesCited.some(
        (s) =>
          s.domain.toLowerCase().includes(scan.domain.toLowerCase()) ||
          s.title.toLowerCase().includes(scan.domain.toLowerCase()) ||
          (brandSlug.length >= 4 && s.title.toLowerCase().includes(brandSlug))
      );

    const competitorsNamed = extractCompetitorsFromAnswer(
      fullText,
      scan.detectedBrand,
      scan.domain
    );

    const cleanExcerpt =
      fullText.replace(/\s+/g, ' ').slice(0, 340) +
      (fullText.length > 340 ? '…' : '');

    return {
      question,
      engine: 'gemini',
      status: 'ok',
      brandNamed,
      domainCited,
      competitorsNamed,
      sourcesCited: sourcesCited.slice(0, 6),
      answerExcerpt: cleanExcerpt,
    };
  } catch (err: any) {
    console.warn('[Gemini Grounded Exception]', err?.message || err);
    return {
      question,
      engine: 'gemini',
      status: 'not_run',
      brandNamed: false,
      domainCited: false,
      competitorsNamed: [],
      sourcesCited: [],
      answerExcerpt:
        lang === 'es'
          ? 'No ejecutado (tiempo de espera agotado).'
          : 'Not run (request timed out).',
    };
  }
}

export async function runGeminiGroundedVisibility(
  questions: string[],
  scan: TechScanResult,
  lang: AuditLang,
  apiKey?: string
): Promise<AiVisibilityResult> {
  const enginesNotRun = [
    'ChatGPT (3x runs in Full $99 Audit)',
    'Google AI Overviews (3x runs in Full $99 Audit)',
    'Google AI Mode (3x runs in Full $99 Audit)',
  ];

  if (!apiKey || apiKey.startsWith('AIzaSy...')) {
    return {
      ranAt: new Date().toISOString(),
      engine: 'gemini',
      totalQuestions: questions.length,
      namedCount: 0,
      citedCount: 0,
      competitorsSummary: [],
      topSourceDomains: [],
      runs: questions.map((question) => ({
        question,
        engine: 'gemini',
        status: 'not_run',
        brandNamed: false,
        domainCited: false,
        competitorsNamed: [],
        sourcesCited: [],
        answerExcerpt:
          lang === 'es'
            ? 'No ejecutado (configura GEMINI_API_KEY en el Worker para activar consultas en vivo con Google Search grounding).'
            : 'Not run (configure GEMINI_API_KEY in the Worker to enable live Google Search-grounded checks).',
      })),
      enginesNotRun,
    };
  }

  const runs = await Promise.all(
    questions.map((q) => runSingleGeminiGroundedPrompt(q, scan, lang, apiKey))
  );

  const validRuns = runs.filter((r) => r.status === 'ok');
  const namedCount = validRuns.filter((r) => r.brandNamed).length;
  const citedCount = validRuns.filter((r) => r.domainCited).length;

  const allCompetitors = new Set<string>();
  const allDomains = new Set<string>();
  for (const r of validRuns) {
    r.competitorsNamed.forEach((c) => allCompetitors.add(c));
    r.sourcesCited.forEach((s) => allDomains.add(s.title || s.domain));
  }

  return {
    ranAt: new Date().toISOString(),
    engine: 'gemini',
    totalQuestions: questions.length,
    namedCount,
    citedCount,
    competitorsSummary: Array.from(allCompetitors).slice(0, 8),
    topSourceDomains: Array.from(allDomains).slice(0, 8),
    runs,
    enginesNotRun,
  };
}
