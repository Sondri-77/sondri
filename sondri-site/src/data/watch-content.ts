import type { Lang } from '../i18n';

export type WatchIconKind =
  | 'question'
  | 'star'
  | 'chart'
  | 'eye'
  | 'doc'
  | 'code'
  | 'globe';

export interface WatchFaqItem {
  q: string;
  a: string;
}

export interface WatchServiceEntry {
  slug: string;
  pillar: '01 · AEO' | '02 · GEO' | '03 · REPUTATION' | '04 · WEBSITES';
  icon: WatchIconKind;
  shortTitle: string;
  title: string;
  cardDesc: string;
  ctaLabel: string;
  headline: string;
  headlineAccent: string;
  summary: string;
  whatWeShip: string[];
  codeTitle: string;
  codeSnippet: string;
  primarySku: string;
  primaryCtaText: string;
  secondarySku: string;
  secondaryCtaText: string;
  faqs: WatchFaqItem[];
}

export interface WatchGuideSection {
  heading: string;
  body: string;
}

export interface WatchGuideEntry {
  slug: string;
  title: string;
  cardDesc: string;
  readTime: string;
  heroSummary: string;
  keyTakeaways: string[];
  sections: WatchGuideSection[];
  checklistTitle: string;
  checklistItems: string[];
  faqs: WatchFaqItem[];
}

export function getWatchServices(lang: Lang): WatchServiceEntry[] {
  const es = lang === 'es';
  return [
    {
      slug: 'aeo',
      pillar: '01 · AEO',
      icon: 'question',
      shortTitle: 'AEO',
      title: es ? 'Servicios de AEO (Answer Engine Optimization)' : 'AEO Services (Answer Engine Optimization)',
      cardDesc: es ? 'Páginas listas para respuesta directa.' : 'Answer-first pages.',
      ctaLabel: es ? 'Servicios AEO →' : 'AEO services →',
      headline: es ? 'Estructura clara para que la IA' : 'Answer-first structure so AI can',
      headlineAccent: es ? 'te cite directo.' : 'extract and recommend you.',
      summary: es
        ? 'Transformamos tus páginas de servicio, precios y FAQ en respuestas limpias y verificables que ChatGPT, Gemini y Google AI Overviews citan con confianza.'
        : 'We restructure your service pages, pricing scope, and FAQs into machine-readable facts that ChatGPT, Gemini, and Google AI Overviews cite cleanly.',
      whatWeShip: es
        ? [
            'Bloques de respuesta directa al inicio de cada servicio clave',
            'Schema JSON-LD validado (Organization, LocalBusiness, Service y FAQPage)',
            'Limpieza de encabezados H1/H2 en formato pregunta-respuesta de comprador',
            'Revisión de exactitud frente a respuestas actuales en 4 motores',
          ]
        : [
            'Direct-answer scope and fee blocks on every core revenue page',
            'Validated JSON-LD (Organization, LocalBusiness, Service & FAQPage)',
            'Buyer-question H2 heading architecture built for zero-click retrieval',
            'Ongoing monthly verification across 4 logged-out AI engines',
          ],
      codeTitle: es ? 'Ejemplo de bloque Service + FAQPage JSON-LD' : 'Sample Service + FAQPage JSON-LD Blueprint',
      codeSnippet: `{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Implant Dentistry & Restorative Care",
  "provider": { "@type": "Dentist", "name": "Riverbend Dental" },
  "areaServed": "Austin, TX"
}`,
      primarySku: 'aeo_full_audit',
      primaryCtaText: es ? 'Solicitar Auditoría 15 Preguntas ($99)' : 'Order $99 Baseline Audit',
      secondarySku: 'fix_sprint',
      secondaryCtaText: es ? 'Implementación Sprint ($499)' : 'Book Fix Sprint ($499)',
      faqs: es
        ? [
            { q: '¿Qué es AEO y en qué mejora a mi web actual?', a: 'AEO (Answer Engine Optimization) organiza hechos clave —qué haces, dónde operas, precios referenciales y preguntas frecuentes— para que los asistentes IA te recomienden sin ambigüedad.' },
            { q: '¿Necesito borrar mis páginas actuales para aplicar AEO?', a: 'No. Optimizamos tus URLs existentes manteniendo el diseño visual y mejorando estructura semántica, schema JSON-LD y bloques citables.' },
            { q: '¿Cuánto tarda Google AI o ChatGPT en leer los cambios AEO?', a: 'Los rastreadores en vivo como OAI-SearchBot y Googlebot suelen re-indexar mejoras técnicas en 2 a 4 semanas tras desplegar.' },
            { q: '¿Cómo mido si el AEO funciona?', a: 'Rastreamos 25 a 75 prompts fijos sin marca cada semana en ChatGPT, Gemini, AI Overviews y AI Mode, midiendo cuota de mención real sin sesión.' },
          ]
        : [
            { q: 'How is AEO different from traditional SEO?', a: 'SEO chases blue-link rankings for keywords; AEO structures clear entity facts, FAQs, and JSON-LD so AI models directly name and cite your business in a 3-brand shortlist.' },
            { q: 'Do I have to rebuild my site for AEO?', a: 'No. We ship schema, llms.txt, and answer-ready FAQ sections directly on your existing stack (WordPress, Webflow, Shopify, Astro, or Next.js).' },
            { q: 'Which AI engines benefit from AEO markup?', a: 'OpenAI ChatGPT search, Google Gemini, Google AI Overviews, Google AI Mode, Perplexity, and Microsoft Bing Copilot all parse structured schema and crisp page answers.' },
            { q: 'What is included in your $99 AEO audit before starting?', a: 'We run 15 unbranded buyer questions × 3 runs across 4 engines (180 checks), verify factual accuracy, and deliver a prioritized fix roadmap in 48 hours.' },
          ],
    },
    {
      slug: 'geo',
      pillar: '02 · GEO',
      icon: 'star',
      shortTitle: 'GEO',
      title: es ? 'Servicios de GEO (Generative Engine Optimization)' : 'GEO Services (Generative Engine Optimization)',
      cardDesc: es ? 'Fuentes externas en las que la IA confía.' : 'Sources AI trusts.',
      ctaLabel: es ? 'Servicios GEO →' : 'GEO services →',
      headline: es ? 'Gana presencia en las fuentes que' : 'Build the external citations',
      headlineAccent: es ? 'la IA sintetiza.' : 'AI models rely on.',
      summary: es
        ? 'Los modelos generativos cruzan múltiples fuentes de la web antes de recomendar una empresa. Mapeamos qué directorios y comparativas están citando y cerramos esas brechas.'
        : 'Generative engines synthesize answers from directories, reviews, and category comparisons across the web. We map who gets cited over you and close the trust gap.',
      whatWeShip: es
        ? [
            'Mapeo exacto de fuentes y directorios citados por ChatGPT y Perplexity',
            'Plan mensual de citas externas por industria y mercado local',
            'Creación de guías comparativas y páginas de prueba con métricas reales',
            'Seguimiento semanal de variación entre competidores en 4 motores',
          ]
        : [
            'Exact domain & directory citation mapping per competitor shortlist',
            'Targeted external listing & category directory placement',
            'Evidence-backed case & comparison pages AI models quote directly',
            'Weekly multi-engine named-share delta and competitor tracking',
          ],
      codeTitle: es ? 'Matriz mensual de citación generativa' : 'Sample GEO Citation Share Matrix',
      codeSnippet: `Prompt Cluster: "Best boutique SaaS contract lawyers"
├─ Sources Cited: Chambers (3x), Justia (2x), Firm FAQ (2x)
├─ Your Domain Citation Rate: 12% -> 46% after Sprint #2
└─ Priority Citation Gap: State Bar Profile + 2 Client Case Pages`,
      primarySku: 'watch_commerce',
      primaryCtaText: es ? 'Iniciar Watch Growth ($299/mes)' : 'Start Watch Growth ($299/mo)',
      secondarySku: 'aeo_full_audit',
      secondaryCtaText: es ? 'Auditoría Base ($99)' : 'Order $99 Baseline Audit',
      faqs: es
        ? [
            { q: '¿Por qué mi sitio aparece en Google pero ChatGPT cita a otro?', a: 'Porque los modelos generativos validan tu reputación en terceros (reseñas, directorios sectoriales, listas locales). El GEO construye y alinea esas citas externas.' },
            { q: '¿Publican enlaces spam en cientos de blogs?', a: 'Nunca. Trabajamos únicamente perfiles verificados de alto peso editorial, cámaras/colegios sectoriales, OpenAI Hub, Bing, Apple y reseñas reales.' },
            { q: '¿Qué incluye Watch Growth en GEO?', a: 'Seguimiento semanal de 40 prompts, rastreo de hasta 3 competidores y 2 páginas citables o mejoras implementadas cada mes.' },
            { q: '¿Sirve para EE.UU. y Latinoamérica?', a: 'Sí. Monitoreamos prompts en inglés (US/CA/UK/AU) y español (Chile, México, Latam) con geo-ubicación limpia sin historial.' },
          ]
        : [
            { q: 'Why does Google rank my site while ChatGPT recommends competitors?', a: 'AI assistants heavily weight corroborating third-party directories, review consistency, and authoritative comparisons—not just domain backlinks.' },
            { q: 'Do you use automated link farms for citation building?', a: 'Never. We focus strictly on verified business hubs, reputable industry directories, authentic reviews, and factual first-party proof pages.' },
            { q: 'How many questions are tracked under Watch Growth GEO plans?', a: 'Watch Starter tracks 25 questions/week ($149/mo), Watch Growth tracks 40/week ($299/mo), and Watch Pro tracks 75/week ($399/mo).' },
            { q: 'Can we track competitors alongside our brand?', a: 'Yes—Watch Growth tracks up to 3 named competitors and Watch Pro tracks up to 5 across every weekly run.' },
          ],
    },
    {
      slug: 'chatgpt-seo',
      pillar: '01 · AEO',
      icon: 'question',
      shortTitle: 'ChatGPT SEO',
      title: es ? 'ChatGPT SEO y OpenAI Business Hub' : 'ChatGPT SEO & OpenAI Business Optimization',
      cardDesc: es ? 'Información clara y verificada para ChatGPT.' : 'Clear, accurate info ChatGPT finds.',
      ctaLabel: es ? 'ChatGPT SEO →' : 'ChatGPT SEO →',
      headline: es ? 'Asegura que ChatGPT encuentre' : 'Make sure ChatGPT gets your',
      headlineAccent: es ? 'datos exactos.' : 'business right.',
      summary: es
        ? 'Habilitamos OAI-SearchBot en tu infraestructura, reclamamos tu perfil en OpenAI Business Hub y alineamos tu sitio con Bing Search para aparecer en respuestas de compra reales.'
        : 'From OAI-SearchBot crawler access to OpenAI Business Hub verification and Bing Search alignment, we make your business eligible and accurate inside ChatGPT Search.',
      whatWeShip: es
        ? [
            'Auditoría y habilitación de OAI-SearchBot y ChatGPT-User en robots.txt / WAF',
            'Reclamación y sincronización en OpenAI Business Hub y Bing AI Performance',
            'Bloques de precios, horarios, zonas y alcance legibles sin ambigüedad',
            'Corridas semanales reproducibles sin sesión iniciada para eliminar sesgos',
          ]
        : [
            'Unblock OAI-SearchBot & ChatGPT-User across robots.txt, Cloudflare & WAF rules',
            'Entity claim & data alignment in OpenAI Business Hub and Bing Webmaster Tools',
            'Clear service area, pricing scope, and contact data formatted for retrieval',
            'Logged-out multi-run prompt verification with screenshot & citation proof',
          ],
      codeTitle: es ? 'Regla robots.txt compatible con ChatGPT' : 'ChatGPT Search Bot Access Policy',
      codeSnippet: `User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

# Optional catalog summary for LLM retrieval
LLMs-Txt: https://yourdomain.com/llms.txt`,
      primarySku: 'listings_sprint',
      primaryCtaText: es ? 'Ordenar AI Listings Sprint ($249)' : 'Book AI Listings Sprint ($249)',
      secondarySku: 'watch_local',
      secondaryCtaText: es ? 'Watch Starter ($149/mes)' : 'Start Watch Starter ($149/mo)',
      faqs: es
        ? [
            { q: '¿Qué es OAI-SearchBot y por qué importa?', a: 'Es el rastreador oficial que OpenAI usa para mostrar resultados web en vivo dentro de ChatGPT. Muchos sitios lo bloquean accidentalmente en Cloudflare o robots.txt.' },
            { q: '¿Puedo pagarle a OpenAI para salir recomendado?', a: 'No en respuestas orgánicas de recomendación. Tu aparición depende de accesibilidad técnica, citas confiables y claridad de servicios.' },
            { q: '¿Por qué verifican Bing además de OpenAI?', a: 'ChatGPT Search se apoya en índices en vivo y señales comerciales cruzadas con Bing Webmaster AI Performance y perfiles locales oficiales.' },
            { q: '¿Cuál es el primer paso más rápido?', a: 'Nuestro AI Listings Sprint ($249 pago único) deja sincronizados ChatGPT Hub, Bing AI, Apple Business Connect y Google Business Profile.' },
          ]
        : [
            { q: 'Could my firewall or Cloudflare be blocking ChatGPT silently?', a: 'Yes—many WAF rules and default WordPress security plugins block OAI-SearchBot. Our free check tests this in seconds.' },
            { q: 'Can businesses pay ChatGPT to appear in recommendations?', a: 'No. Organic buyer recommendations depend strictly on verifiable entity trust, clear service pages, and trusted external sources.' },
            { q: 'Why does Bing setup affect ChatGPT answers?', a: 'OpenAI indexes live web signals alongside Bing Webmaster infrastructure and verified local business directories.' },
            { q: 'What if ChatGPT gives outdated prices or wrong hours for my business?', a: 'We pinpoint which stale directory or un-marked page ChatGPT is quoting and update both your on-site schema and official business hubs.' },
          ],
    },
    {
      slug: 'google-ai-overviews',
      pillar: '01 · AEO',
      icon: 'eye',
      shortTitle: 'Google AI Overviews',
      title: es ? 'Google AI Overviews y Google AI Mode' : 'Google AI Overviews & AI Mode Visibility',
      cardDesc: es ? 'Citas directas en los resúmenes IA de Google.' : 'Get cited by Google AI.',
      ctaLabel: es ? 'AI Overviews →' : 'AI Overviews →',
      headline: es ? 'Aparece dentro de las respuestas IA' : 'Earn citations inside',
      headlineAccent: es ? 'de Google.' : 'Google AI Overviews.',
      summary: es
        ? 'Cuando Google resume la respuesta encima de los resultados clásicos, cita fuentes con velocidad alta, datos estructurados limpios y respuestas directas al comprador.'
        : 'When Google answers above organic blue links, it selects fast, semantically clean pages backed by validated schema and consistent Google Business entities.',
      whatWeShip: es
        ? [
            'Optimización de Core Web Vitals (LCP, INP, CLS) en móvil',
            'Datos estructurados Service, Product/Offer, Review y FAQPage sin errores',
            'Alineación de Google Business Profile, categorías y atributos locales',
            'Monitoreo semanal separado para AI Overviews y Google AI Mode',
          ]
        : [
            'Mobile Core Web Vitals optimization (TTFB, LCP & layout stability)',
            'Error-free Organization, LocalBusiness, Product/Offer & FAQPage JSON-LD',
            'Google Business Profile category & attribute synchronization',
            'Separate weekly tracking across both AI Overviews and Google AI Mode',
          ],
      codeTitle: es ? 'Checklist Google AI Overviews + Speed' : 'Google AI Retrieval Signal Stack',
      codeSnippet: `1. Googlebot & Google-Extended crawl: 200 OK
2. Mobile Lighthouse Performance: >= 90 / 100
3. Schema Graph: LocalBusiness -> Service -> FAQPage
4. Answer Block: Concise 45-65 word factual lead per topic`,
      primarySku: 'website_quick_fix',
      primaryCtaText: es ? 'Website Quick Fix ($390)' : 'Order Website Quick Fix ($390)',
      secondarySku: 'watch_local',
      secondaryCtaText: es ? 'Watch Starter ($149/mes)' : 'Start Watch Starter ($149/mo)',
      faqs: es
        ? [
            { q: '¿Qué diferencia hay entre Google AI Overviews y AI Mode?', a: 'AI Overviews muestra una síntesis sobre los enlaces del buscador clásico; AI Mode es la experiencia conversacional completa de Google donde el usuario compara proveedores en detalle.' },
            { q: '¿La velocidad web influye en las citas de Google AI?', a: 'Sí. Páginas lentas en móvil (>4s) o con errores de renderizado pierden prioridad al extraer citas frente a competidores ligeros.' },
            { q: '¿Cómo lo miden en Sondri Watch?', a: 'Nuestro motor de auditoría evalúa Google AI Overviews y Google AI Mode como canales independientes cada semana.' },
            { q: '¿Pueden acelerar mi sitio actual sin rehacerlo?', a: 'Sí, con nuestro Website Quick Fix ($390) optimizamos velocidad móvil, schema JSON-LD e infraestructura en tu sitio actual.' },
          ]
        : [
            { q: 'What is the difference between AI Overviews and Google AI Mode?', a: 'AI Overviews appear at the top of standard search results; AI Mode is Google’s multi-turn conversational buyer interface—we track both separately.' },
            { q: 'Does page speed really matter for AI Overviews?', a: 'Yes. Slow mobile TTFB and broken hydration cause crawlers to pass over otherwise strong service providers.' },
            { q: 'How does Website Quick Fix ($390) help?', a: 'We tune mobile Core Web Vitals, repair crawl blockers, deploy clean JSON-LD, and ship an answer-first service block on your existing domain.' },
            { q: 'Do you sync Google Business Profile too?', a: 'Yes—GBP categories, services, and reviews feed directly into local AI Overview shortlists.' },
          ],
    },
    {
      slug: 'perplexity-gemini',
      pillar: '02 · GEO',
      icon: 'star',
      shortTitle: 'Perplexity & Gemini',
      title: es ? 'Visibilidad en Google Gemini y Perplexity' : 'Google Gemini & Perplexity Visibility',
      cardDesc: es ? 'Presencia y citas en ambos buscadores IA.' : 'Visibility in grounded web AI.',
      ctaLabel: es ? 'Perplexity y Gemini →' : 'Perplexity & Gemini →',
      headline: es ? 'Conquista los motores que' : 'Win citations in live',
      headlineAccent: es ? 'citan cada fuente.' : 'grounded web search.',
      summary: es
        ? 'Tanto Gemini con búsqueda web como Perplexity muestran tarjetas con enlaces visibles junto a cada afirmación. Preparamos páginas ricas en hechos verificables para ganar esos clics citados.'
        : 'Both web-grounded Gemini and Perplexity attach clickable citation cards next to every recommendation. We structure transparent factual proof so buyers click straight to your domain.',
      whatWeShip: es
        ? [
            'Habilitación de PerplexityBot y rastreadores Google-Extended / Gemini',
            'Páginas técnicas y de casos con cifras citables, alcances y garantías',
            'Tablas comparativas HTML limpias (legibles sin JavaScript pesado)',
            'Auditoría de enlaces citados en Gemini Live Grounding',
          ]
        : [
            'Clean crawler policies for PerplexityBot & Gemini web grounding agents',
            'Evidence-dense service & case study pages with clear proof metrics',
            'Clean HTML spec & comparison sections readable without client hydration',
            'Live Gemini web-grounding checks built into every Watch wave',
          ],
      codeTitle: es ? 'Formato citable para Gemini & Perplexity' : 'High-Citation HTML Proof Pattern',
      codeSnippet: `<section aria-label="Typical Scope & Turnaround">
  <h2>What Does the Engagement Include?</h2>
  <p>Fixed-scope delivery in 14 days with zero annual lock-in...</p>
  <dl><!-- Machine-readable key facts --></dl>
</section>`,
      primarySku: 'aeo_full_audit',
      primaryCtaText: es ? 'Auditoría Completa ($99)' : 'Order $99 Baseline Audit',
      secondarySku: 'watch_pro',
      secondaryCtaText: es ? 'Watch Pro ($399/mes)' : 'Start Watch Pro ($399/mo)',
      faqs: es
        ? [
            { q: '¿Por qué Perplexity cita distinto a ChatGPT?', a: 'Perplexity prioriza páginas con tablas limpias, comparativas objetivas y fuentes con hechos específicos recién indexados.' },
            { q: '¿Usan la API real de Gemini en las pruebas?', a: 'Sí. Nuestro inspector gratuito y nuestras auditorías consultan Gemini con Google Search grounding activo en tiempo real.' },
            { q: '¿Qué industrias reciben más tráfico desde Perplexity y Gemini?', a: 'Software B2B, estudios legales, clínicas de especialidad, consultorías y ecommerce técnico con compras de alto valor.' },
            { q: '¿Puedo empezar solo con la auditoría de $99?', a: 'Claro. Recibes 15 preguntas × 3 repeticiones por motor (180 chequeos) antes de decidir cualquier plan mensual.' },
          ]
        : [
            { q: 'Do your audits test live Gemini with real web grounding?', a: 'Yes—our checker and monthly Watch runner query Gemini with live Google Search grounding enabled, capturing cited domains directly.' },
            { q: 'Why does Perplexity skip marketing landing pages?', a: 'Perplexity strips vague superlatives and favors pages with structured HTML facts, clear deliverables, pricing ranges, and original proof.' },
            { q: 'How many prompts can Watch Pro track weekly across engines?', a: 'Watch Pro tracks up to 75 buyer prompts every week across cities, specialties, or product categories.' },
            { q: 'Can you publish new comparison and FAQ pages for us each month?', a: 'Yes—Watch Growth includes 2 pages/fixes shipped monthly and Watch Pro includes 4.' },
          ],
    },
    {
      slug: 'llms-txt-schema',
      pillar: '01 · AEO',
      icon: 'code',
      shortTitle: 'llms.txt & Schema',
      title: es ? 'Implementación Técnica de llms.txt y JSON-LD Schema' : 'llms.txt & JSON-LD Schema Engineering',
      cardDesc: es ? 'Arquitectura legible para rastreadores IA.' : 'Technical AI readiness.',
      ctaLabel: es ? 'Configuración técnica →' : 'llms.txt & schema →',
      headline: es ? 'Código limpio sin errores que' : 'Zero-error markup that',
      headlineAccent: es ? 'los LLM leen rápido.' : 'AI bots parse instantly.',
      summary: es
        ? 'Generamos e implementamos tu archivo /llms.txt, reglas robots.txt para bots IA y un grafo JSON-LD sin errores (Organization, Service, Product/Offer y FAQPage) en tu dominio.'
        : 'We engineer clean /llms.txt indexes, AI-friendly robots.txt policies, and validated JSON-LD graphs linking your Organization, Services, Products, and FAQs.',
      whatWeShip: es
        ? [
            'Publicación de /llms.txt y /llms-full.txt optimizados para lectura de agentes',
            'Limpieza de robots.txt para OAI-SearchBot, PerplexityBot y Googlebot',
            'Grafo JSON-LD validado sin errores en Schema Markup Validator / Rich Results',
            'Etiquetas Product / Offer / MerchantReturnPolicy para ecommerce (ACP / UCP)',
          ]
        : [
            'Clean /llms.txt & /llms-full.txt index endpoints tailored to key buyer flows',
            'Validated robots.txt crawler policy permitting live AI retrieval agents',
            'Linked JSON-LD graph connecting Organization, Services, Locations & FAQs',
            'Offer, ShippingDetails & ReturnPolicy markup for Shopify ACP / Google UCP',
          ],
      codeTitle: es ? 'Grafo JSON-LD conectado con @id' : 'Connected @id Schema Graph',
      codeSnippet: `{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://example.com/#org", "name": "..." },
    { "@type": "Service", "provider": { "@id": "https://example.com/#org" } },
    { "@type": "FAQPage", "mainEntity": [ ... ] }
  ]
}`,
      primarySku: 'fix_sprint',
      primaryCtaText: es ? 'Fix Sprint Técnico ($499)' : 'Book Fix Sprint ($499)',
      secondarySku: 'website_quick_fix',
      secondaryCtaText: es ? 'Website Quick Fix ($390)' : 'Website Quick Fix ($390)',
      faqs: es
        ? [
            { q: '¿Qué es el archivo /llms.txt?', a: 'Es un índice en Markdown plano en la raíz de tu sitio (similar a robots.txt o sitemap.xml) que resume servicios, precios, documentación y rutas prioritarias para agentes IA.' },
            { q: '¿Basta tener un plugin SEO genérico en WordPress para el schema?', a: 'La mayoría de plugins generan grafos desconectados o genéricos sin campos específicos de especialidad clínica, LegalService o políticas de oferta. Nosotros escribimos el grafo completo validado.' },
            { q: '¿Lo implementan en Webflow, Shopify, WordPress o Astro/Next.js?', a: 'Sí. Trabajamos sobre tu stack actual o desplegamos los endpoints desde Worker/CMS sin tiempo fuera de línea.' },
            { q: '¿Incluye FAQ Schema en nuestras páginas de servicio?', a: 'Sí—cada servicio y guía implementada incluye bloques FAQPage JSON-LD válidos que alimentan tanto Google como respuestas LLM.' },
          ]
        : [
            { q: 'What is /llms.txt and why publish one?', a: '/llms.txt is a structured Markdown directory at your domain root guiding LLM retrievers straight to your core service, pricing, and FAQ pages.' },
            { q: 'Doesn’t Yoast or RankMath already output schema?', a: 'Generic plugins output minimal boilerplate. AI search engines extract far better facts from connected Service, LegalService/Dentist, Offer, and FAQPage nodes.' },
            { q: 'Which CMS and frameworks can Sondri engineers ship directly to?', a: 'WordPress, Webflow, Shopify (Liquid/Hydrogen), Astro, Next.js, and Cloudflare Pages/Workers.' },
            { q: 'Can this be bundled with speed optimization?', a: 'Yes—Website Quick Fix ($390) bundles Core Web Vitals speed tuning, llms.txt, and validated JSON-LD together.' },
          ],
    },
    {
      slug: 'citation-building',
      pillar: '03 · REPUTATION',
      icon: 'doc',
      shortTitle: 'Citations & Reputation',
      title: es ? 'Reputación IA y Construcción de Citas' : 'AI Reputation & Citation Building',
      cardDesc: es ? 'Alineación de reseñas y directorios oficiales.' : 'Ethical mentions & official hubs.',
      ctaLabel: es ? 'Reputación y citas →' : 'Citations & hubs →',
      headline: es ? 'Alinea las señales externas que' : 'Align every directory and',
      headlineAccent: es ? 'verifican tu nombre.' : 'official AI hub.',
      summary: es
        ? 'Si OpenAI Business Hub, Bing AI Performance, Google Business Profile o directorios médicos/legales muestran datos distintos, los LLM bajan tu confianza y eligen a otro.'
        : 'Conflicting NAP details, stale review profiles, or unclaimed OpenAI/Bing business hubs cause AI assistants to hesitate and recommend competitors instead.',
      whatWeShip: es
        ? [
            'Reclamación y verificación en OpenAI Business Hub, Bing AI, Apple y GBP',
            'Limpieza de consistencia Nombre–Dirección–Teléfono–Categoría (NAP)',
            'Auditoría de directorios clave citados en tu nicho (G2, Clutch, Avvo, portales médicos)',
            'Estrategia y plantillas limpias para incrementar reseñas verificadas en clientes',
          ]
        : [
            'Full setup across OpenAI Business Hub, Bing AI, Apple Business & GBP',
            'Cross-web Name, Address, Phone & category attribute reconciliation',
            'Closing missing high-authority industry listings competitors hold',
            'Repeatable verified review velocity workflow built cleanly into ops',
          ],
      codeTitle: es ? 'Estado de Sincronización de Entidad' : 'Entity Reputation Sync Checklist',
      codeSnippet: `├─ OpenAI Business Hub: CLAIMED & VERIFIED
├─ Bing Webmaster AI:   CLAIMED & CATEGORISED
├─ Google Business:     SYNCED (Hours + Services)
└─ Apple Business:      VERIFIED (Maps & Siri Data)`,
      primarySku: 'listings_sprint',
      primaryCtaText: es ? 'AI Listings Sprint ($249)' : 'Book AI Listings Sprint ($249)',
      secondarySku: 'watch_local',
      secondaryCtaText: es ? 'Watch Starter ($149/mes)' : 'Start Watch Starter ($149/mo)',
      faqs: es
        ? [
            { q: '¿Qué es OpenAI Business Hub?', a: 'El portal oficial donde las empresas verifican su identidad, dirección, sitio web y categorías directamente ante el ecosistema de búsqueda de ChatGPT.' },
            { q: '¿Cuántos directorios cubren en el Sprint de $249?', a: 'Configuramos los 4 pilares oficiales (OpenAI Business Hub, Bing AI Performance, Apple Business Connect y Google Business Profile) y corregimos inconsistencias críticas.' },
            { q: '¿Las reseñas de Google influyen en ChatGPT?', a: 'Sí—ChatGPT, Gemini y Perplexity combinan reseñas de Google, Trustpilot, G2 y portales sectoriales como señal de confianza local.' },
            { q: '¿Cuánto demora el AI Listings Sprint?', a: 'Completamos la configuración y entregas de verificación dentro de 5 a 7 días hábiles según aprobaciones de cada plataforma.' },
          ]
        : [
            { q: 'How does the $249 AI Listings Sprint work?', a: 'In one sprint, our team claims, verifies, and synchronizes OpenAI Business Hub, Bing AI Performance, Apple Business Connect, and Google Business Profile.' },
            { q: 'Do reviews impact AI recommendations?', a: 'Yes—both sentiment themes inside reviews (e.g., “same-day emergency care”, “transparent B2B pricing”) and review volume reinforce AI shortlist confidence.' },
            { q: 'Can conflicting addresses or old hours hurt AI visibility?', a: 'Yes. Contradictory metadata across directories causes retrieval confidence to drop, pushing clean competitors ahead.' },
            { q: 'Does Watch Pro include ongoing directory expansion?', a: 'Yes—Watch Pro includes active third-party citation gap closing and competitor benchmark monitoring.' },
          ],
    },
    {
      slug: 'websites',
      pillar: '04 · WEBSITES',
      icon: 'globe',
      shortTitle: 'Websites',
      title: es ? 'Sitios Web Answer-Ready y Rediseño Rápido (desde $390)' : 'Answer-Ready Websites & Speed Upgrades (from $390)',
      cardDesc: es ? 'Quick Fix $390 · 5 págs $690 · 10 págs $1,190.' : 'Quick Fix $390 · 5p $690 · 10p $1,190.',
      ctaLabel: es ? 'Ver precios de Sitios Web →' : 'Website pricing →',
      headline: es ? 'Sitios diseñados para convertir' : 'Websites built for human trust',
      headlineAccent: es ? 'humanos e IA.' : 'and AI recommendations.',
      summary: es
        ? 'Construimos sitios rápidos (95+ Lighthouse) y páginas de servicio diseñadas desde cero para responder a compradores reales y cumplir con todos los estándares técnicos de IA.'
        : 'Whether you need a focused upgrade on your existing domain ($390) or a complete 5-page ($690) or 10-page ($1,190) website, every build ships fast, clean, and AEO-ready.',
      whatWeShip: es
        ? [
            'Website Quick Fix ($390): Core Web Vitals + llms.txt + Schema JSON-LD + 1 bloque FAQ en tu web actual',
            'Sitio Answer-Ready de 5 Páginas ($690): Inicio, Servicios, Hub FAQ, Quiénes Somos y Contacto',
            'Sitio Custom de 10 Páginas ($1,190): Páginas dedicadas por servicio/ciudad + comparativas + AI Hubs',
            'Entrega llave en mano con puntaje 95+ de rendimiento y cero bloqueo de bots IA',
          ]
        : [
            'Quick Fix ($390): Tune speed, add llms.txt + full JSON-LD schema & 1 answer-ready block on your current site',
            '5-Page Answer-Ready Site ($690): Fast conversion architecture (Home, Services, FAQ Hub, About, Contact) + schema',
            '10-Page Custom Growth Site ($1,190): Dedicated practice/service pages, comparisons, bilingual/local SEO & AI hubs',
            '95+ mobile Lighthouse target, Service + FAQPage JSON-LD on every page, and full code ownership',
          ],
      codeTitle: es ? 'Comparativa rápida de paquetes web' : 'Website Package Tiers at a Glance',
      codeSnippet: `Quick Fix ($390)      -> Keep current site + speed + schema + llms.txt
5-Page Site ($690)    -> Full 5-page fast AEO site + FAQ hub + JSON-LD
10-Page Site ($1,190) -> Multi-service custom site + comparisons + AI Hubs`,
      primarySku: 'website_5page',
      primaryCtaText: es ? 'Ordenar Sitio 5 Páginas ($690)' : 'Order 5-Page Website ($690)',
      secondarySku: 'website_quick_fix',
      secondaryCtaText: es ? 'Website Quick Fix ($390)' : 'Order Quick Fix ($390)',
      faqs: es
        ? [
            { q: '¿Qué diferencia hay entre el Quick Fix ($390) y el Sitio de 5 páginas ($690)?', a: 'El Quick Fix mejora velocidad, crawlers IA, llms.txt y schema JSON-LD sobre tu diseño actual. El paquete de $690 construye un sitio nuevo limpio de 5 páginas listo para AEO y alta conversión.' },
            { q: '¿Soy dueño completo del código y dominio del sitio web?', a: 'Sí, 100%. No te atamos a licencias propietarias ni mensualidades ocultas de hosting; desplegamos en Cloudflare Pages, Vercel, Astro o tu servidor.' },
            { q: '¿Incluye cada página su propio Service y FAQPage schema?', a: 'Sí. Cada página de servicio lleva su grafo JSON-LD validado y sección de preguntas frecuentes legible para humanos e IA.' },
            { q: '¿Puedo combinar un Sitio Web nuevo con Sondri Watch mensual?', a: 'Sí—el paquete de 5 o 10 páginas prepara la base técnica perfecta para que Sondri Watch escale menciones mes a mes.' },
          ]
        : [
            { q: 'Should I choose Website Quick Fix ($390) or the 5-Page Build ($690)?', a: 'Pick Quick Fix if you already like your design and just need speed, llms.txt, and JSON-LD fixed. Pick the 5-Page ($690) or 10-Page ($1,190) build if your site is outdated, slow, or missing dedicated service pages.' },
            { q: 'Do I own the code and hosting outright?', a: 'Yes—100% ownership with zero proprietary CMS lock-in. We deploy to modern fast hosting (Cloudflare, Vercel) or hand over full source files.' },
            { q: 'Does every service page include FAQ schema?', a: 'Yes. Every website we ship includes Service, Organization/LocalBusiness, and FAQPage JSON-LD out of the box.' },
            { q: 'How long does a 5-page or 10-page build take?', a: 'Quick Fix ships in 5 business days; 5-page builds launch in ~2 weeks; 10-page custom sites launch in ~3 weeks.' },
          ],
    },
  ];
}

export function getWatchGuides(lang: Lang): WatchGuideEntry[] {
  const es = lang === 'es';
  return [
    {
      slug: 'what-is-ai-visibility',
      title: es ? '¿Qué es la visibilidad en IA?' : 'What is AI visibility?',
      cardDesc: es ? 'Por qué las respuestas IA hoy generan clientes.' : 'Why AI answers now drive inquiries.',
      readTime: es ? 'Lectura 3 min' : '3 min read',
      heroSummary: es
        ? 'La visibilidad en IA mide cuántas veces—y con qué precisión—ChatGPT, Gemini y Google AI nombran a tu empresa cuando un comprador pregunta a quién contratar.'
        : 'AI visibility measures how often—and how accurately—ChatGPT, Gemini, and Google AI name and recommend your business when buyers ask unbranded category questions.',
      keyTakeaways: es
        ? [
            'Los compradores saltan de diez enlaces azules a una terna de 3 marcas recomendadas.',
            'No basta existir en Google: debes ser legible, verificable y citado por terceros.',
            'Medir sin sesión iniciada evita resultados falsos causados por tu historial.',
          ]
        : [
            'Buyers increasingly skip ten blue links for a 3-brand AI shortlist.',
            'Ranking on page one of Google no longer guarantees ChatGPT names you.',
            'Always measure logged out across multiple engines and repeated runs.',
          ],
      sections: es
        ? [
            { heading: 'El cambio de búsqueda a respuesta directa', body: 'En vez de abrir cinco pestañas y comparar sitios manualmente, los clientes preguntan: "¿Qué estudio revisa contratos ejecutivos?" o "¿Qué clínica dental en Las Condes hace implantes?". El motor sintetiza una lista corta de 3 a 5 opciones.' },
            { heading: 'Qué evalúa un motor antes de nombrarte', body: 'Primero verifica si puede rastrear tu sitio (robots.txt y velocidad). Luego extrae hechos concretos (servicios, ciudad, precios, schema) y los contrasta con perfiles oficiales como OpenAI Business Hub, Bing y reseñas en Google.' },
            { heading: 'Por qué las pymes de alta calidad suelen quedar fuera', body: 'Muchos negocios excelentes tienen sitios lentos, texto comercial genérico y cero preguntas respondidas con claridad. Un competidor más pequeño pero con estructura AEO limpia gana la recomendación.' },
          ]
        : [
            { heading: 'From ten blue links to a 3-brand shortlist', body: 'Instead of opening eight browser tabs, buyers now ask ChatGPT, Gemini, or Google AI who handles their exact need in their city. The assistant picks three to five businesses and explains why.' },
            { heading: 'What AI checks before recommending you', body: 'Answer engines look for crawler access (OAI-SearchBot), machine-readable JSON-LD facts, direct answers on pricing and scope, and consistent third-party verification across OpenAI Hub, Bing, Apple, and Google reviews.' },
            { heading: 'Why great firms get skipped silently', body: 'Years of offline reputation won’t protect you if your website relies on vague slogans, hides answers inside PDFs, or blocks AI crawlers via strict firewalls.' },
          ],
      checklistTitle: es ? 'Chequeo rápido de 3 señales' : '3-Signal Quick Self-Check',
      checklistItems: es
        ? [
            '¿Permite tu robots.txt a OAI-SearchBot y PerplexityBot?',
            '¿Tienen tus páginas principales JSON-LD válido (LocalBusiness / Service / FAQPage)?',
            '¿Aparecen tus servicios, horarios y reseñas iguales en Google, Bing y OpenAI?',
          ]
        : [
            'Does your robots.txt allow OAI-SearchBot and PerplexityBot?',
            'Do core service pages publish valid Service + FAQPage schema?',
            'Are your services, city, and reviews aligned across Google, Bing, Apple & OpenAI?',
          ],
      faqs: es
        ? [
            { q: '¿La visibilidad IA reemplaza al SEO tradicional?', a: 'No, lo extiende. Las bases rápidas del SEO técnico siguen alimentando Google AI Overviews, mientras AEO y GEO cubren el salto hacia respuestas generativas.' },
            { q: '¿Puedo revisarlo gratis hoy?', a: 'Sí, nuestro test en watch.sondri.ai corre tus filtros técnicos y 3 prompts reales de compra en 60 segundos.' },
            { q: '¿Qué necesito para mejorar rápido?', a: 'Habilitar rastreadores, publicar schema válido, sincronizar perfiles oficiales IA y responder directo las dudas reales del comprador.' },
          ]
        : [
            { q: 'Does AI visibility replace classic SEO?', a: 'No—clean technical SEO still feeds Google’s index and AI Overviews, while AEO and GEO extend that foundation into conversational assistants.' },
            { q: 'How fast can I check where my business stands?', a: 'Under 60 seconds on our free 3-question check at watch.sondri.ai.' },
            { q: 'Do local service businesses benefit too?', a: 'Especially local and specialty firms—dentists, law firms, advisors, and B2B specialists get high-intent shortlist calls when named directly.' },
          ],
    },
    {
      slug: 'geo-vs-aeo-vs-seo',
      title: es ? 'GEO vs AEO vs SEO en español claro' : 'GEO vs AEO vs SEO',
      cardDesc: es ? 'La diferencia práctica sin siglas confusas.' : 'The difference, in plain English.',
      readTime: es ? 'Lectura 3 min' : '3 min read',
      heroSummary: es
        ? 'SEO logra que tu web aparezca en la lista de Google. AEO organiza tu sitio para dar respuestas directas. GEO construye las citas externas que los LLM sintetizan.'
        : 'SEO ranks your links on Google. AEO formats your pages for direct answers. GEO builds the external citations generative AI relies on to trust your name.',
      keyTakeaways: es
        ? [
            'SEO: Posicionar páginas en resultados clásicos de búsqueda.',
            'AEO: Convertir tus servicios y FAQ en hechos estructurados citables.',
            'GEO: Ganar presencia en fuentes externas y comparativas multi-motor.',
          ]
        : [
            'SEO targets keyword rankings across ten blue search links.',
            'AEO structures your own website (schema, llms.txt, clear FAQs) to be extracted cleanly.',
            'GEO builds third-party citations, reviews, and category presence across engines.',
          ],
      sections: es
        ? [
            { heading: 'SEO: La base de rastreo y velocidad', body: 'Sin URLs rápidas, buen título HTML ni autoridad básica de dominio, ni los buscadores clásicos ni las capas IA modernas indexan bien tus páginas.' },
            { heading: 'AEO: Optimización de tu sitio como fuente oficial', body: 'AEO se enfoca en lo que controlas dentro de tu web: schema JSON-LD por servicio, archivos llms.txt y bloques claros con alcances y precios.' },
            { heading: 'GEO: Consenso externo en toda la web', body: 'GEO asegura que cuando ChatGPT o Perplexity consultan reseñas, cámaras sectoriales y listados de confianza, encuentren consenso positivo sobre ti.' },
          ]
        : [
            { heading: 'Classic SEO: Indexation & speed floor', body: 'Traditional SEO keeps pages fast, crawlable, and indexed—serving as the plumbing underneath both blue links and Google AI Overviews.' },
            { heading: 'AEO: Making your website answer-ready', body: 'Answer Engine Optimization focuses on everything on your own domain: Service & FAQPage schema, clean /llms.txt files, and explicit buyer-facing answers.' },
            { heading: 'GEO: Winning third-party consensus', body: 'Generative Engine Optimization closes directory gaps, directory inconsistencies, and external comparison mentions that models use to double-check claims.' },
          ],
      checklistTitle: es ? 'Cómo los combina Sondri Watch' : 'How Sondri Combines All Three',
      checklistItems: es
        ? [
            'Base web rápida (SEO Técnico / CWV)',
            'Schema JSON-LD + FAQ citables en tus páginas (AEO)',
            'Directorios oficiales + seguimiento semanal multi-motor (GEO)',
          ]
        : [
            'Fast mobile Core Web Vitals & clean crawlability (Technical SEO)',
            'Validated JSON-LD + direct answer blocks (AEO)',
            'Official AI hubs + weekly prompt & citation tracking (GEO)',
          ],
      faqs: es
        ? [
            { q: '¿Tengo que contratar tres agencias distintas?', a: 'No. En Sondri Watch unificamos SEO técnico, AEO estructural y monitoreo GEO en un único flujo mensual desde $149/mes.' },
            { q: '¿Cuál implementar primero?', a: 'Empieza siempre por AEO técnico (bots, velocidad y schema), luego alinea perfiles oficiales y fortalece citas GEO.' },
            { q: '¿Necesito llms.txt si ya tengo sitemap.xml?', a: 'Sí, el sitemap lista cientos de URLs sin contexto; llms.txt resume qué haces y dónde están tus mejores respuestas.' },
          ]
        : [
            { q: 'Which should a business fix first?', a: 'Start with technical AEO & speed (bots, schema, official hubs), then layer ongoing answer-ready pages and GEO citations.' },
            { q: 'Is SEO dead because of ChatGPT?', a: 'No—live search grounding relies heavily on indexed, fast web pages. Good SEO now feeds AI answers.' },
            { q: 'Do all Sondri Watch plans include both AEO and GEO?', a: 'Yes—every Watch plan tracks live generative engines and ships on-site technical AEO fixes every month.' },
          ],
    },
    {
      slug: 'how-ai-chooses-businesses',
      title: es ? 'Cómo elige empresas la IA' : 'How AI chooses businesses',
      cardDesc: es ? 'Fuentes usadas por ChatGPT, Gemini y Perplexity.' : 'Sources ChatGPT, Gemini & Perplexity use.',
      readTime: es ? 'Lectura 4 min' : '4 min read',
      heroSummary: es
        ? 'Cuando pides una recomendación sin nombrar marcas, los modelos combinan 4 señales: claridad del sitio, fichas oficiales verificadas, citas externas y reseñas recientes.'
        : 'Answer engines filter providers through four sequential gates before recommending a shortlist: crawler access, on-site entity facts, official listings, and third-party corroboration.',
      keyTakeaways: es
        ? [
            'Gate 01: Rastreadores habilitados y respuesta móvil rápida.',
            'Gate 02: Schema JSON-LD y páginas de servicio sin jerga vaga.',
            'Gate 03–04: OpenAI Hub, Bing AI, GBP y citas consistentes.',
          ]
        : [
            'Crawlers must reach and parse your pages quickly on mobile.',
            'Verified Service + Location + FAQ schema removes guesswork.',
            'OpenAI Hub, Bing AI, Apple Business & GBP cross-check your identity.',
          ],
      sections: es
        ? [
            { heading: '1. ¿Puede el bot leer tu sitio en tiempo real?', body: 'Muchos firewalls bloquean bots de OpenAI o Perplexity sin avisar. Si el bot recibe error 403 o la página tarda demasiado, tu dominio se descarta al instante.' },
            { heading: '2. ¿Dicen tus páginas exactamente qué resuelves?', body: 'Frases genéricas como "soluciones integrales" no ayudan al LLM. Los modelos buscan especialidades concretas, ubicaciones exactas, garantías y preguntas frecuentes.' },
            { heading: '3. ¿Confirman otros sitios lo que afirmas?', body: 'El modelo cruza tu sitio contra Google Business Profile, OpenAI Business Hub, Bing y directorios del rubro antes de exponerte en una recomendación.' },
          ]
        : [
            { heading: '1. Live crawler retrieval & speed filter', body: 'If WAF rules block OAI-SearchBot or slow hydration delays first paint, live retrieval times out and filters out your domain.' },
            { heading: '2. Specific answers beat vague slogans', body: 'LLMs skip vague phrases like "bespoke excellence" in favor of clear facts: exact specialty, service area, timeline, and buyer FAQs.' },
            { heading: '3. Multi-source entity corroboration', body: 'Before recommending a business, engines verify consistency across GBP, Bing Places/AI, Apple Business Connect, OpenAI Business Hub, and trusted niche directories.' },
          ],
      checklistTitle: es ? 'Ver lo técnico en profundidad' : 'Want the Technical Engineering View?',
      checklistItems: es
        ? [
            'Lee nuestra guía completa de los 4 filtros técnicos en Guías y Packs.',
            'Revisa tu score gratis (0–100) directamente en el inicio.',
          ]
        : [
            'Inspect our full 4-Gate technical engineering spec in Reads & Playbooks.',
            'Run the live 0–100 Free AI Visibility checker on our overview page.',
          ],
      faqs: es
        ? [
            { q: '¿Influyen los precios públicos en las recomendaciones?', a: 'Cuando un comprador pregunta por rango o transparencia, mostrar precios referenciales claros aumenta fuertemente la probabilidad de cita.' },
            { q: '¿Por qué cambian los resultados entre dos consultas seguidas?', a: 'Los LLM son probabilísticos y actualizan fuentes en vivo; por eso medimos 3 corridas repetidas por pregunta en nuestra auditoría de $99.' },
            { q: '¿Puedo ver exactamente qué fuentes leyó ChatGPT?', a: 'Sí—nuestro reporte de 15 preguntas muestra qué dominios y directorios citó cada motor en tus prompts.' },
          ]
        : [
            { q: 'Does publishing pricing or minimums help AI recommend us?', a: 'Yes—when buyers ask about cost or fit, transparent pricing ranges give AI assistants a concrete reason to cite you accurately.' },
            { q: 'Why do results vary slightly across runs?', a: 'LLMs sample probabilistically and update live search citations constantly, which is why our $99 audit runs every prompt 3 times per engine.' },
            { q: 'Do your reports list which directories AI relied on?', a: 'Yes—every full audit and monthly Watch report surfaces exact competitor names and cited source domains.' },
          ],
    },
    {
      slug: 'why-chatgpt-doesnt-recommend-you',
      title: es ? 'Por qué ChatGPT no te recomienda' : 'Why ChatGPT doesn’t recommend you',
      cardDesc: es ? 'Causas más comunes y cómo se corrigen.' : 'Common causes and fixes.',
      readTime: es ? 'Lectura 4 min' : '4 min read',
      heroSummary: es
        ? 'Casi siempre ocurre por una de cuatro fallas concretas: bloqueo de OAI-SearchBot, cero páginas específicas por servicio, schema ausente o perfiles oficiales desalineados.'
        : 'When ChatGPT recommends competitors instead of your company, it usually traces back to four concrete issues: crawler blocks, generic pages, missing schema, or unsynced directories.',
      keyTakeaways: es
        ? [
            '403 / WAF bloqueando OAI-SearchBot en Cloudflare o plugins.',
            'Una sola página "Servicios" genérica en lugar de una página por especialidad.',
            'Sin OpenAI Business Hub reclamado ni Bing Webmaster verificado.',
          ]
        : [
            'Silent crawler blocks hiding your domain from OAI-SearchBot.',
            'Lumping all services onto one vague overview page instead of dedicated pages.',
            'Missing OpenAI Business Hub & Bing AI verification or stale directory hours.',
          ],
      sections: es
        ? [
            { heading: 'Error 1: Tu web bloquea al bot sin que lo sepas', body: 'Reglas automáticas anti-scraping de Cloudflare o Wordfence bloquean con frecuencia a ChatGPT-User y OAI-SearchBot. Tu web funciona para humanos, pero es invisible para ChatGPT.' },
            { heading: 'Error 2: Tienes un texto bonito, pero sin hechos citables', body: 'Si un paciente busca "implantes con sedación" y tu web solo dice "odontología integral", ChatGPT citará al competidor que dedicó una sección completa al tratamiento.' },
            { heading: 'Error 3: Tu ficha en directorios contradice a tu web', body: 'Teléfonos distintos, categorías equivocadas o cero reseñas recientes frenan la recomendación.' },
          ]
        : [
            { heading: 'Cause 1: Bot access is blocked at CDN or robots level', body: 'Aggressive bot-protection rules frequently block OAI-SearchBot by default while appearing normal to human visitors.' },
            { heading: 'Cause 2: Generic overview copy with no specialty depth', body: 'When a buyer asks a narrow specialty question, AI picks competitors that publish dedicated service + FAQ pages matching that exact need.' },
            { heading: 'Cause 3: Outdated or contradictory external listings', body: 'Old business descriptions in Bing, Yelp, legal/medical directories, or unclaimed OpenAI hubs erode model trust.' },
          ],
      checklistTitle: es ? 'Pasos para revertirlo' : 'How to Diagnose It Today',
      checklistItems: es
        ? [
            'Corre el Score Gratis para validar OAI-SearchBot y JSON-LD en segundos.',
            'Pide la Auditoría 15 Preguntas ($99) para ver el detalle exacto de competidores.',
          ]
        : [
            'Run our free 3-question check to verify OAI-SearchBot & JSON-LD live.',
            'Book the $99 Baseline Audit to pinpoint which competitors & directories replace you.',
          ],
      faqs: es
        ? [
            { q: '¿Qué pasa si ChatGPT inventa datos sobre nuestra empresa?', a: 'Publicando hechos explícitos en JSON-LD, FAQ y OpenAI Business Hub reemplazamos las alucinaciones antiguas por datos verificados.' },
            { q: '¿Desbloquear bots IA hará que nos roben contenido para entrenar?', a: 'Puedes permitir OAI-SearchBot (para aparecer citado en búsquedas en vivo) mientras decides por separado sobre GPTBot (entrenamiento).' },
            { q: '¿Cuánto cuesta arreglarlo llave en mano?', a: 'Desde $249 en AI Listings Sprint, $390 en Website Quick Fix o $499 en Fix Sprint.' },
          ]
        : [
            { q: 'Can we allow ChatGPT live search without allowing AI model training?', a: 'Yes—allowing OAI-SearchBot lets you show up in live search citations while keeping separate robots.txt policies for GPTBot training crawlers.' },
            { q: 'What if ChatGPT quotes wrong services or closed locations?', a: 'Updating on-site JSON-LD, OpenAI Business Hub, Bing AI, and Google Business Profile resolves factual hallucinations rapidly.' },
            { q: 'How can Sondri fix this for us quickly?', a: 'Start with the $99 Audit or book our $249 Listings Sprint / $390 Website Quick Fix directly.' },
          ],
    },
    {
      slug: 'how-to-measure-ai-visibility',
      title: es ? 'Cómo medir visibilidad en IA' : 'How to measure AI visibility',
      cardDesc: es ? 'Cómo seguir preguntas, menciones y tráfico.' : 'Tracking questions, mentions & leads.',
      readTime: es ? 'Lectura 3 min' : '3 min read',
      heroSummary: es
        ? 'No revises ChatGPT desde tu propia cuenta logueada: tu memoria de chat contamina la respuesta. La medición seria fija preguntas reales sin sesión, las repite y audita menciones y leads.'
        : 'Checking ChatGPT from your own logged-in browser misleads you due to personalization memory. Real measurement fixes buyer prompts, runs logged out across engines, and tracks share over time.',
      keyTakeaways: es
        ? [
            'Prohibido medir con cuenta personal: usa corridas limpias sin sesión.',
            'Fija un conjunto estable de 25 a 75 preguntas de compra sin marca.',
            'Compara cuota de mención semanal frente a 3–5 competidores reales.',
          ]
        : [
            'Never benchmark from a logged-in personal AI session with memory enabled.',
            'Freeze a repeatable prompt set (15 to 75 buyer questions) across 4 engines.',
            'Track citation accuracy, competitor share, and inbound attribution monthly.',
          ],
      sections: es
        ? [
            { heading: 'Por qué falla revisar manualmente en tu computador', body: 'ChatGPT recuerda tu historial e incluso tu propio sitio web visitado. Si preguntas por tu rubro en sesión iniciada, te mostrará sesgos que un cliente nuevo jamás verá.' },
            { heading: 'La regla de las 3 repeticiones por motor', body: 'Como los modelos varían su respuesta en cada corrida, una sola ejecución miente. Repetir cada pregunta 3 veces en ChatGPT, Gemini, AI Overviews y AI Mode revela tu tasa real de aparición.' },
            { heading: 'De menciones a reuniones y ventas', body: 'En Sondri Watch cruzamos evolución semanal de cuota nombrada con formularios UTM/referrer de chatgpt.com y consultas entrantes ("los encontré por ChatGPT").' },
          ]
        : [
            { heading: 'Why logged-in spot checks are unreliable', body: 'Logged-in accounts carry chat memory, location history, and prior brand visits—often flattering your own business while hiding real buyer gaps.' },
            { heading: 'Frozen prompt panels across 4 engines', body: 'Fixing 25–75 realistic buyer questions and running them cleanly every week gives an honest apples-to-apples trendline as models update.' },
            { heading: 'Connecting visibility to real revenue', body: 'Pair weekly named-share percentages with exact citation links and self-reported "How did you hear about us?" CRM tracking.' },
          ],
      checklistTitle: es ? 'Métricas incluidas en Sondri Watch' : 'Metrics in Every Monthly Watch Report',
      checklistItems: es
        ? [
            '% Named-Share semanal por motor (ChatGPT, Gemini, AI Overviews, AI Mode)',
            'Comparativa directa de menciones frente a 3–5 competidores',
            'Revisión de exactitud de datos y fuentes externas citadas',
          ]
        : [
            'Weekly Named-Share % per engine (ChatGPT, Gemini, AI Overviews, AI Mode)',
            'Head-to-head competitor share comparison',
            'Factual accuracy log & exact third-party cited sources',
          ],
      faqs: es
        ? [
            { q: '¿Qué muestran en el Reporte Mensual de Ejemplo?', a: 'Puedes ver un reporte completo interactivo (y descargable en PDF) en /es/watch/sample-report/.' },
            { q: '¿Cuántas preguntas incluye cada plan?', a: 'Gratis: 3 preguntas · Auditoría $99: 15 preguntas × 3 corridas · Starter: 25/sem · Growth: 40/sem · Pro: 75/sem.' },
            { q: '¿Puedo agregar nuestras propias preguntas clave?', a: 'Sí—ajustamos tus preguntas reales de ventas y servicios antes de fijar la línea base.' },
          ]
        : [
            { q: 'Can I see what the monthly Watch report looks like before buying?', a: 'Yes—visit /watch/sample-report/ to inspect a complete interactive monthly report with before/after diffs.' },
            { q: 'How many prompts are included across Free vs. Paid plans?', a: 'Free check: 3 prompts · $99 Audit: 15 prompts × 3 runs · Starter: 25/wk · Growth: 40/wk · Pro: 75/wk.' },
            { q: 'Can we customize the buyer questions tracked?', a: 'Yes—we lock prompts tailored to your highest-margin services and target cities.' },
          ],
    },
    {
      slug: 'llms-txt-schema-and-ai-crawlers',
      title: es ? 'Guía técnica simple: llms.txt, schema y bots IA' : 'llms.txt, schema and AI crawlers',
      cardDesc: es ? 'Guía técnica sin rodeos sobre cómo te leen los bots.' : 'A plain-English technical guide.',
      readTime: es ? 'Lectura 4 min' : '4 min read',
      heroSummary: es
        ? 'Tres archivos técnicos silenciosos deciden si los buscadores IA leen tu sitio con facilidad o te pasan por alto: robots.txt, JSON-LD Schema y /llms.txt.'
        : 'Three quiet website building blocks decide whether AI search crawlers extract accurate business facts smoothly or skip right past you: robots.txt, JSON-LD schema, and /llms.txt.',
      keyTakeaways: es
        ? [
            'robots.txt abre la puerta a OAI-SearchBot y PerplexityBot.',
            'JSON-LD entrega datos estructurados de servicio, sede y FAQ sin ambigüedad.',
            '/llms.txt funciona como mapa ejecutivo rápido para agentes.',
          ]
        : [
            'robots.txt sets live crawl access for OAI-SearchBot, PerplexityBot & Googlebot.',
            'JSON-LD schema translates human pages into machine-verified entities.',
            '/llms.txt gives AI agents a concise Markdown roadmap to top pages.',
          ],
      sections: es
        ? [
            { heading: '1. robots.txt: Tu portero digital', body: 'Si un bot de búsqueda entra a robots.txt y ve Disallow: /, abandona tu sitio. Confirmar que OAI-SearchBot y PerplexityBot tienen Allow: / es el paso número uno.' },
            { heading: '2. JSON-LD Schema: La ficha técnica oficial', body: 'Es un bloque invisible dentro del <head> HTML que define sin dudas tu razón social, especialidad médica o legal, rango de precios y preguntas frecuentes (FAQPage).' },
            { heading: '3. /llms.txt: El resumen ejecutivo en Markdown', body: 'Permite que cualquier agente IA lea en una sola petición qué vendes, tus URLs clave de precios/contacto y tus respuestas oficiales.' },
          ]
        : [
            { heading: '1. robots.txt: Controlling live retrieval', body: 'Many teams accidentally lump live search crawlers (OAI-SearchBot) together with training scrapers, starving ChatGPT Search of fresh company pages.' },
            { heading: '2. JSON-LD Schema: Machine-verified facts', body: 'Placed cleanly in your HTML <head>, JSON-LD states exact business name, areaServed, services, Offer terms, and FAQPage answers without ambiguity.' },
            { heading: '3. /llms.txt: An agent-first table of contents', body: 'Hosted at your root domain, /llms.txt points AI retrievers straight to your core service descriptions, docs, and pricing instead of noisy marketing banners.' },
          ],
      checklistTitle: es ? 'Incluido en Website Quick Fix ($390)' : 'Shipped Cleanly in Website Quick Fix ($390)',
      checklistItems: es
        ? [
            'Limpieza de robots.txt + Cloudflare WAF',
            'Grafo JSON-LD Organization / Service / FAQPage validado',
            'Publicación de /llms.txt y mejora de velocidad móvil',
          ]
        : [
            'robots.txt & WAF bot verification',
            'Error-free Organization, Service & FAQPage JSON-LD',
            'Live /llms.txt endpoint + Core Web Vitals tuning',
          ],
      faqs: es
        ? [
            { q: '¿Este código rompe el diseño visual de mi página?', a: 'Para nada—robots.txt, llms.txt y JSON-LD viven fuera del layout visual y dejan tu diseño intacto.' },
            { q: '¿Tienen una herramienta para chequear esto ya mismo?', a: 'Sí—nuestro test gratuito revisa en vivo tu robots.txt, llms.txt y schema actual en menos de 10 segundos.' },
            { q: '¿Cuánto cuesta implementarlo si no tenemos programador?', a: 'Nuestro Website Quick Fix ($390) o Fix Sprint ($499) deja todo desplegado por nuestros ingenieros.' },
          ]
        : [
            { q: 'Will JSON-LD or llms.txt change how my site looks to visitors?', a: 'No—these live cleanly in <head> metadata and root text files without altering your visual design.' },
            { q: 'Can I test my current technical status for free?', a: 'Yes—our on-page checker inspects your live robots.txt, llms.txt, schema graph, and mobile Lighthouse speed immediately.' },
            { q: 'Who implements these fixes if I hire Sondri?', a: 'Our software engineers write, validate, and deploy the changes directly on your site stack.' },
          ],
    },
    {
      slug: 'is-ai-visibility-worth-it',
      title: es ? '¿Vale la pena invertir en visibilidad IA?' : 'Is AI visibility worth it?',
      cardDesc: es ? 'Una respuesta honesta según tu tipo de negocio.' : 'An honest answer.',
      readTime: es ? 'Lectura 3 min' : '3 min read',
      heroSummary: es
        ? 'Tiene alto retorno cuando el cliente compara confianza antes de cotizar o agendar (clínicas, abogados, B2B, remodelación, ecommerce especializado). Si vendes commodities de impulso bajo $10, probablemente no sea prioridad aún.'
        : 'AI visibility pays off quickly for high-trust, high-ticket, or comparison-heavy buyers (clinics, law firms, B2B ops, ecommerce). For low-margin impulse items, classic social ads may beat it first.',
      keyTakeaways: es
        ? [
            'Alto ROI si el ticket promedio supera ~$300 USD o genera clientes recurrentes.',
            'Un solo paciente de implante, caso legal o contrato B2B cubre todo el año de Watch.',
            'Garantía clara: Mes 4 gratis si tu visibilidad no mejora tras 3 meses.',
          ]
        : [
            'Strongest ROI when one new client is worth $300–$5,000+.',
            'Just 1–2 extra recommended inquiries cover an entire year of Watch.',
            'Backed by our accountability promise: Month 4 free if visibility hasn’t moved after 3 months.',
          ],
      sections: es
        ? [
            { heading: 'Cuándo SÍ conviene invertir ya', body: 'Si tus compradores investigan opciones, comparan especialistas por reputación o preguntan a colegas/IA antes de agendar una llamada—estar fuera de la terna IA significa perder clientes listos para comprar.' },
            { heading: 'Cuándo conviene esperar o hacer solo el Quick Fix', body: 'Si recién lanzas sin clientes ni reseñas base, prioriza primero construir un sitio claro de 5 páginas ($690) y tus primeras reseñas verificadas antes de pagar monitoreo mensual.' },
            { heading: 'La economía simple de 1 cliente adicional', body: 'En Watch Starter ($149/mes) o Growth ($299/mes), conseguir apenas un caso o paciente nuevo cada trimestre supera ampliamente el costo anual, y además conservas el patrimonio de mejoras en tu sitio.' },
          ]
        : [
            { heading: 'When it delivers immediate ROI', body: 'If buyers research before calling—comparing dentists, law firms, SaaS tools, contractors, or specialized ecommerce brands—getting named directly in AI answers brings warm, ready-to-buy leads.' },
            { heading: 'When to start small instead of a retainer', body: 'If your website is outdated or missing basic service pages, start with the $99 Audit or a $690 5-Page Answer-Ready Site before adding recurring tracking.' },
            { heading: 'Simple math with zero lock-in', body: 'At $149–$399/month with no annual contract and Month 4 free if there is no improvement after 3 months, one extra client typically covers the program many times over.' },
          ],
      checklistTitle: es ? '¿Califica tu empresa hoy?' : 'Quick Fit Test',
      checklistItems: es
        ? [
            'Valor de cliente superior a $400 USD → Alta prioridad',
            'Clientes comparan en Google / IA antes de cotizar → Alta prioridad',
            'Empresa busca posicionarse antes que su competencia local → Gran ventaja temprana',
          ]
        : [
            'Client lifetime value above $400 → High ROI candidate',
            'Buyers research specialty / city / price fit online → High ROI candidate',
            'Competitors already appearing in your Free 3-Question Check → Urgent opportunity',
          ],
      faqs: es
        ? [
            { q: '¿Exigen contratos anuales de 12 meses?', a: 'No. Sin ataduras anuales; puedes cancelar con 30 días de aviso previo.' },
            { q: '¿Qué cubre la garantía del Mes 4 gratis?', a: 'Si tras 3 meses continuos de Sondri Watch no observamos mejora medible en tu cuota de visibilidad en tus prompts fijos, el mes 4 corre sin costo.' },
            { q: '¿Puedo empezar solo con la auditoría de $99 para comprobar el tamaño del problema?', a: 'Sí—y esos $99 se abonan íntegros al primer mes si decides continuar con un plan Watch.' },
          ]
        : [
            { q: 'Do you lock clients into 12-month contracts?', a: 'Never. Monthly Watch plans require zero annual lock-in—cancel with 30 days’ notice.' },
            { q: 'How does the $99 Audit credit work?', a: 'Order the $99 15-question audit first; if you move into Watch Starter, Growth, or Pro within 30 days, your $99 is credited toward month one.' },
            { q: 'How does the Month 4 guarantee work?', a: 'If your frozen prompt visibility has not improved measurably after 3 consecutive months on Watch, Month 4 is completely free.' },
          ],
    },
    {
      slug: 'how-much-does-ai-visibility-cost',
      title: es ? '¿Cuánto cuesta la visibilidad en IA?' : 'How much does AI visibility cost?',
      cardDesc: es ? 'Precios transparentes de mercado en 2026.' : 'Transparent 2026 pricing breakdown.',
      readTime: es ? 'Lectura 3 min' : '3 min read',
      heroSummary: es
        ? 'Desglose directo de cuánto cuesta diagnosticar, corregir webs y monitorear mensualmente con Sondri Watch—sin cotizaciones opacas ni extras sorpresa.'
        : 'A clear breakdown of what it costs to test, fix, build answer-ready websites, and track AI visibility monthly with Sondri Watch—with every price published upfront.',
      keyTakeaways: es
        ? [
            'Gratis ($0): Diagnóstico en vivo en web + 3 preguntas.',
            'Auditoría Base ($99 pago único): 15 preguntas × 3 corridas (abonable al Mes 1).',
            'Sondri Watch: $149 / $299 / $399 al mes · Sitios Web: $390 / $690 / $1,190.',
          ]
        : [
            'Free ($0): Instant live check on 3 questions + technical crawler scan.',
            'Baseline Audit ($99 one-time): 15 buyer questions × 3 runs across 4 engines (credited to Month 1).',
            'Monthly Watch: $149 · $299 · $399/mo · Answer-Ready Websites: $390 · $690 · $1,190.',
          ],
      sections: es
        ? [
            { heading: 'Paso 1: Gratis ($0) o Auditoría Completa ($99)', body: 'Empiezas gratis en 60 segundos para detectar bloqueos técnicos y ver cómo responden 3 preguntas base. Cuando quieras la radiografía completa frente a 3 competidores con lista prioritaria de fixes, pides la auditoría de $99 (abonable al mes 1).' },
            { heading: 'Paso 2: Sprints de Sitio Web e Implementación ($390–$1,190)', body: '¿Solo quieres arreglar tu web o lanzar un sitio nuevo optimizado para IA? Ofrecemos Website Quick Fix ($390), Sitio 5 Páginas ($690) y Sitio Custom 10 Páginas ($1,190), además de AI Listings Sprint ($249).' },
            { heading: 'Paso 3: Planes Mensuales Sondri Watch ($149–$399/mes)', body: 'Monitoreo semanal continuo en 4 motores (25, 40 o 75 preguntas fijas) más mejoras técnicas y páginas citables implementadas directamente por nuestros ingenieros cada mes. 15% de descuento al pagar trimestral.' },
          ]
        : [
            { heading: 'Step 1: Free Check ($0) or Full Baseline Audit ($99)', body: 'Run the instant 3-question check free online to diagnose gaps. Upgrade to the $99 one-time 15-question audit (180 live checks + competitor matrix + prioritized fix roadmap) credited toward Month 1 of Watch.' },
            { heading: 'Step 2: Websites & Technical Sprints ($249–$1,190)', body: 'Fix your existing site fast ($390 Quick Fix or $249 AI Listings Sprint), or launch a brand-new 5-page ($690) or 10-page ($1,190) answer-ready website built with full Service & FAQ schema.' },
            { heading: 'Step 3: Monthly Sondri Watch ($149 · $299 · $399/mo)', body: 'Weekly 4-engine tracking across 25, 40, or 75 frozen buyer questions paired with 1–4 shipped fixes/pages per month. Save 15% on quarterly billing.' },
          ],
      checklistTitle: es ? 'Resumen a simple vista' : 'Pricing at a Glance',
      checklistItems: es
        ? [
            'Starter $149 (25 preguntas) · Growth $299 (40 preguntas) · Pro $399/mes (75 preguntas)',
            'Auditoría Base $99 abonable al primer mes de Watch',
            'Sitios Web: Quick Fix $390 · 5 páginas $690 · 10 páginas $1,190',
          ]
        : [
            'Starter $149 (25 Qs) · Growth $299 (40 Qs) · Pro $399/mo (75 Qs)',
            'Full 15-Question Audit $99 (credited toward Month 1)',
            'Websites: Quick Fix $390 · 5 pages $690 · 10 pages $1,190',
          ],
      faqs: es
        ? [
            { q: '¿Hay algún cobro oculto de setup en los planes Watch?', a: 'No. Si ya hiciste la auditoría de $99 incluso se abona directo a tu primer mes.' },
            { q: '¿Aceptan tarjetas en USD desde EE.UU., Chile o Latam?', a: 'Sí—el checkout seguro vía Stripe acepta tarjetas corporativas e internacionales con recibo/factura al instante.' },
            { q: '¿Tienen precios especiales para agencias?', a: 'Sí—en /es/watch/partners/ ofrecemos monitoreo marca blanca desde $79/cliente/mes y auditorías mayoristas.' },
          ]
        : [
            { q: 'Are there hidden onboarding fees?', a: 'Zero hidden fees—and if you start with the $99 audit, it credits directly toward Month 1 of any Watch plan.' },
            { q: 'Do you offer quarterly discounts?', a: 'Yes—save 15% when paying quarterly, with 30 days’ notice to cancel anytime.' },
            { q: 'Do agencies get wholesale rates?', a: 'Yes—our White-Label Agency Partner program starts at $79/client/month on /watch/partners/.' },
          ],
    },
  ];
}
