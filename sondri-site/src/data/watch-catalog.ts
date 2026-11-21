export const INTAKE_STORAGE_KEY = 'sondri_watch_intake';

export interface WatchIntakePrefill {
  audit_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  domain?: string;
  city?: string;
  service?: string;
  notes?: string;
}

export type WatchIntakeProfile =
  | 'audit'
  | 'watch_plan'
  | 'website_build'
  | 'website_fix'
  | 'sprint'
  | 'agency'
  | 'portfolio';

export interface WatchIntakeProfileCopy {
  modalTitle: string;
  projectHeading: string;
  domainLabel: string;
  domainPlaceholder: string;
  domainHint: string;
  domainErr: string;
  marketLabel: string;
  marketPlaceholder: string;
  marketHint: string;
  marketErr: string;
  notesLabel: string;
  notesPlaceholder: string;
  notesHint: string;
}

export const WATCH_INTAKE_PROFILES: Record<
  WatchIntakeProfile,
  {
    order: 'domain_first' | 'market_first';
    en: WatchIntakeProfileCopy;
    es: WatchIntakeProfileCopy;
  }
> = {
  audit: {
    order: 'domain_first',
    en: {
      modalTitle: 'Tell us what we’re auditing',
      projectHeading: 'About your business',
      domainLabel: 'Your website',
      domainPlaceholder: 'yourbusiness.com',
      domainHint: 'The site we’ll audit across ChatGPT, Gemini & Google AI.',
      domainErr: 'Enter a valid website domain (for example, yoursite.com).',
      marketLabel: 'What you offer & where you serve',
      marketPlaceholder: 'Dental implants in Austin, TX',
      marketHint: 'So we test the real questions your customers ask AI.',
      marketErr: 'Tell us what you offer and the city or market you serve.',
      notesLabel: 'Competitors or focus areas',
      notesPlaceholder: 'e.g. 2 competitors to benchmark, or priority services',
      notesHint: 'Optional — helps us tailor the audit report.',
    },
    es: {
      modalTitle: 'Cuéntanos qué negocio auditaremos',
      projectHeading: 'Sobre tu negocio',
      domainLabel: 'Tu sitio web',
      domainPlaceholder: 'tunegocio.com',
      domainHint: 'El sitio que evaluaremos en ChatGPT, Gemini y Google AI.',
      domainErr: 'Ingresa un dominio válido (ej. tunegocio.com).',
      marketLabel: 'Qué ofreces y dónde atiendes',
      marketPlaceholder: 'Implantes dentales en Santiago',
      marketHint: 'Para probar las preguntas reales que tus clientes hacen en IA.',
      marketErr: 'Cuéntanos qué servicio ofreces y tu ciudad o mercado.',
      notesLabel: 'Competidores o focos prioritarios',
      notesPlaceholder: 'Ej. 2 competidores a comparar o servicios prioritarios',
      notesHint: 'Opcional — nos ayuda a personalizar tu reporte.',
    },
  },
  watch_plan: {
    order: 'domain_first',
    en: {
      modalTitle: 'Set up your monthly monitoring',
      projectHeading: 'About your business',
      domainLabel: 'Website to monitor',
      domainPlaceholder: 'yourbusiness.com',
      domainHint: 'We’ll track your AI visibility and citations weekly on this site.',
      domainErr: 'Enter a valid website domain (for example, yoursite.com).',
      marketLabel: 'Main services & service area',
      marketPlaceholder: 'Cosmetic dentistry in Miami, FL',
      marketHint: 'Used to build your monthly buyer-question scorecard.',
      marketErr: 'Tell us your main services and target city or region.',
      notesLabel: 'Competitors or goals to track',
      notesPlaceholder: 'e.g. Top 2 competitors, priority products, or your CMS',
      notesHint: 'Optional — we’ll also confirm priorities after checkout.',
    },
    es: {
      modalTitle: 'Configura tu monitoreo mensual',
      projectHeading: 'Sobre tu negocio',
      domainLabel: 'Sitio web a monitorear',
      domainPlaceholder: 'tunegocio.com',
      domainHint: 'Monitorearemos semanalmente tu visibilidad y citas en IA.',
      domainErr: 'Ingresa un dominio válido (ej. tunegocio.com).',
      marketLabel: 'Servicios principales y zona',
      marketPlaceholder: 'Clínica dental estética en Providencia, Santiago',
      marketHint: 'Lo usamos para construir tu tablero mensual de preguntas reales.',
      marketErr: 'Cuéntanos tus servicios principales y la ciudad o zona.',
      notesLabel: 'Competidores u objetivos a monitorear',
      notesPlaceholder: 'Ej. 2 competidores clave, líneas prioritarias o tu CMS',
      notesHint: 'Opcional — confirmaremos detalles contigo después del pago.',
    },
  },
  website_build: {
    order: 'market_first',
    en: {
      modalTitle: 'Tell us about your new website',
      projectHeading: 'About your website project',
      domainLabel: 'Current website or domain idea',
      domainPlaceholder: 'yourbusiness.com',
      domainHint: 'Leave blank if you’re starting fresh — we’ll help you set up a domain.',
      domainErr: 'Enter a valid website domain (for example, yoursite.com), or leave it blank.',
      marketLabel: 'Business name, what you do & location',
      marketPlaceholder: 'Harbor Dental — Dentistry in Austin, TX',
      marketHint: 'Helps us plan your pages, copy structure, and local visibility.',
      marketErr: 'Tell us your business name, what you offer, and where you operate.',
      notesLabel: 'Goals, pages, or sites you like',
      notesPlaceholder: 'e.g. Online booking, EN/ES site, or sites whose style you like',
      notesHint: 'Optional — share as much or as little as you have right now.',
    },
    es: {
      modalTitle: 'Cuéntanos sobre tu nuevo sitio web',
      projectHeading: 'Sobre tu proyecto web',
      domainLabel: 'Sitio actual o idea de dominio',
      domainPlaceholder: 'tunegocio.com',
      domainHint: 'Déjalo vacío si partes desde cero — te ayudamos a configurarlo.',
      domainErr: 'Ingresa un dominio válido (ej. tunegocio.com) o déjalo vacío.',
      marketLabel: 'Nombre del negocio, qué haces y ciudad',
      marketPlaceholder: 'Clínica Puerto — Dental en Santiago',
      marketHint: 'Nos ayuda a estructurar tus páginas y tu visibilidad local.',
      marketErr: 'Cuéntanos el nombre de tu negocio, qué ofreces y tu ciudad.',
      notesLabel: 'Objetivos, páginas o sitios de referencia',
      notesPlaceholder: 'Ej. Agenda online, sitio EN/ES o webs que te gusten',
      notesHint: 'Opcional — comparte lo que ya tengas en mente.',
    },
  },
  website_fix: {
    order: 'domain_first',
    en: {
      modalTitle: 'Tell us about the site to upgrade',
      projectHeading: 'About your current website',
      domainLabel: 'Website to speed up & upgrade',
      domainPlaceholder: 'yourbusiness.com',
      domainHint: 'The live site where we’ll improve speed, FAQs & AI readiness.',
      domainErr: 'Enter the live website domain you want us to upgrade.',
      marketLabel: 'Website platform & what you do',
      marketPlaceholder: 'WordPress — Family law firm in Denver, CO',
      marketHint: 'Lets us plan the right speed and technical fixes for your stack.',
      marketErr: 'Tell us your website platform (if known) and what your business does.',
      notesLabel: 'Biggest issues you want fixed first',
      notesPlaceholder: 'e.g. Slow mobile loading, missing schema/FAQ answers, outdated service pages',
      notesHint: 'Optional — we’ll audit and prioritize everything on kickoff.',
    },
    es: {
      modalTitle: 'Cuéntanos qué sitio vamos a mejorar',
      projectHeading: 'Sobre tu sitio web actual',
      domainLabel: 'Sitio web a acelerar y optimizar',
      domainPlaceholder: 'tunegocio.com',
      domainHint: 'El sitio actual donde mejoraremos velocidad, FAQs y visibilidad IA.',
      domainErr: 'Ingresa el dominio del sitio web que vamos a optimizar.',
      marketLabel: 'Plataforma y rubro de tu negocio',
      marketPlaceholder: 'WordPress — Estudio jurídico en Santiago',
      marketHint: 'Nos ayuda a preparar las mejoras técnicas y de velocidad adecuadas.',
      marketErr: 'Cuéntanos tu plataforma web (si la sabes) y qué hace tu negocio.',
      notesLabel: 'Principales problemas a resolver primero',
      notesPlaceholder: 'Ej. Carga lenta en móvil, falta de schema/FAQs, páginas desactualizadas',
      notesHint: 'Opcional — lo priorizaremos contigo en la partida.',
    },
  },
  sprint: {
    order: 'domain_first',
    en: {
      modalTitle: 'Confirm details for your sprint',
      projectHeading: 'About your business',
      domainLabel: 'Your website',
      domainPlaceholder: 'yourbusiness.com',
      domainHint: 'The site we’ll align across AI search hubs and structured data.',
      domainErr: 'Enter a valid website domain (for example, yoursite.com).',
      marketLabel: 'Business location & main service',
      marketPlaceholder: 'Roofing & solar installation in Phoenix, AZ',
      marketHint: 'Keeps your business details consistent across Google, Apple, Bing & ChatGPT.',
      marketErr: 'Tell us your business location and main service.',
      notesLabel: 'Website platform or extra locations',
      notesPlaceholder: 'e.g. WordPress / Webflow / Shopify, or multiple branch locations',
      notesHint: 'Optional — helps us prepare your implementation checklist.',
    },
    es: {
      modalTitle: 'Confirma los datos para tu sprint',
      projectHeading: 'Sobre tu negocio',
      domainLabel: 'Tu sitio web',
      domainPlaceholder: 'tunegocio.com',
      domainHint: 'El sitio que alinearemos en directorios de IA y datos estructurados.',
      domainErr: 'Ingresa un dominio válido (ej. tunegocio.com).',
      marketLabel: 'Ubicación y servicio principal',
      marketPlaceholder: 'Energía solar y techos en Santiago',
      marketHint: 'Mantiene coherentes tus datos en Google, Apple, Bing y ChatGPT.',
      marketErr: 'Cuéntanos tu ubicación y servicio principal.',
      notesLabel: 'Plataforma web o sucursales adicionales',
      notesPlaceholder: 'Ej. WordPress / Webflow / Shopify, o varias sucursales',
      notesHint: 'Opcional — nos ayuda a preparar el checklist de implementación.',
    },
  },
  agency: {
    order: 'domain_first',
    en: {
      modalTitle: 'Add your client’s details',
      projectHeading: 'About your agency client',
      domainLabel: 'Client website',
      domainPlaceholder: 'clientbusiness.com',
      domainHint: 'The client site we’ll audit for your white-label report.',
      domainErr: 'Enter your client’s website domain.',
      marketLabel: 'Client’s main service & city',
      marketPlaceholder: 'Orthodontics clinic in Dallas, TX',
      marketHint: 'Calibrates the buyer questions inside your client’s report.',
      marketErr: 'Tell us your client’s main service and city.',
      notesLabel: 'Agency name & white-label notes',
      notesPlaceholder: 'e.g. Studio North — deliver in Spanish, include comparison notes',
      notesHint: 'Optional — add branding or delivery preferences.',
    },
    es: {
      modalTitle: 'Ingresa los datos de tu cliente',
      projectHeading: 'Sobre el cliente de tu agencia',
      domainLabel: 'Sitio web del cliente',
      domainPlaceholder: 'sitiocliente.com',
      domainHint: 'El sitio de tu cliente que analizaremos en formato marca blanca.',
      domainErr: 'Ingresa el dominio web de tu cliente.',
      marketLabel: 'Servicio principal y ciudad del cliente',
      marketPlaceholder: 'Clínica de ortodoncia en Providencia, Santiago',
      marketHint: 'Calibra las preguntas reales dentro del reporte de tu cliente.',
      marketErr: 'Cuéntanos el servicio principal y la ciudad de tu cliente.',
      notesLabel: 'Nombre de tu agencia y notas marca blanca',
      notesPlaceholder: 'Ej. Studio North — entregar en español, incluir comparativa',
      notesHint: 'Opcional — agrega preferencias de marca o entrega.',
    },
  },
  portfolio: {
    order: 'market_first',
    en: {
      modalTitle: 'Tell us about your portfolio',
      projectHeading: 'Portfolio scope',
      domainLabel: 'Main group website',
      domainPlaceholder: 'yourgroup.com',
      domainHint: 'Optional — share individual company domains below or on our kickoff call.',
      domainErr: 'Enter a valid website domain (for example, yourgroup.com), or leave it blank.',
      marketLabel: 'Fund, group, or holding name & industry',
      marketPlaceholder: 'Andes Health Group — 8 dental & medical clinics',
      marketHint: 'Helps us scope the consolidated benchmark across your companies.',
      marketErr: 'Tell us your fund or group name and main sector.',
      notesLabel: 'Portfolio domains or priority brands',
      notesPlaceholder: 'List up to 10 company websites, or leave blank to share after checkout',
      notesHint: 'Optional.',
    },
    es: {
      modalTitle: 'Cuéntanos sobre tu portafolio',
      projectHeading: 'Alcance del portafolio',
      domainLabel: 'Sitio principal del grupo',
      domainPlaceholder: 'tugrupo.com',
      domainHint: 'Opcional — puedes indicar las empresas abajo o en nuestra reunión inicial.',
      domainErr: 'Ingresa un dominio válido (ej. tugrupo.com) o déjalo vacío.',
      marketLabel: 'Nombre del grupo o fondo e industria',
      marketPlaceholder: 'Grupo Salud Andes — 8 clínicas dentales y médicas',
      marketHint: 'Nos ayuda a dimensionar el benchmark consolidado del portafolio.',
      marketErr: 'Cuéntanos el nombre de tu grupo o fondo y su industria.',
      notesLabel: 'Dominios del portafolio o marcas prioritarias',
      notesPlaceholder: 'Lista hasta 10 sitios de empresas, o déjalo vacío para compartirlo después',
      notesHint: 'Opcional.',
    },
  },
};

export interface WatchClientSkuInfo {
  sku: string;
  mode: 'one_time' | 'subscription';
  intakeProfile: WatchIntakeProfile;
  priceEn: string;
  priceEs: string;
  titleEn: string;
  titleEs: string;
  guaranteeEn: string;
  guaranteeEs: string;
  domainRequired: boolean;
  marketRequired: boolean;
}

export const WATCH_CLIENT_CATALOG: Record<string, WatchClientSkuInfo> = {
  aeo_full_audit: {
    sku: 'aeo_full_audit',
    mode: 'one_time',
    intakeProfile: 'audit',
    priceEn: '$99 one-time',
    priceEs: '$99 pago único',
    titleEn: 'Full 4-Engine AI Visibility Audit',
    titleEs: 'Auditoría Completa en 4 Motores de IA',
    guaranteeEn: '100% credited toward Month 1 if you start any Watch plan.',
    guaranteeEs: '100% abonable al Mes 1 si continúas con cualquier plan Watch.',
    domainRequired: true,
    marketRequired: true,
  },
  listings_sprint: {
    sku: 'listings_sprint',
    mode: 'one_time',
    intakeProfile: 'sprint',
    priceEn: '$249 one-time',
    priceEs: '$249 pago único',
    titleEn: 'AI Listings & Official Hubs Sprint',
    titleEs: 'Sprint Directorios Oficiales IA',
    guaranteeEn: 'Delivered in 5 business days across OpenAI Hub, Bing, Apple & Google.',
    guaranteeEs: 'Entregado en 5 días hábiles en OpenAI Hub, Bing, Apple y Google.',
    domainRequired: true,
    marketRequired: true,
  },
  clinicas_pack: {
    sku: 'clinicas_pack',
    mode: 'one_time',
    intakeProfile: 'audit',
    priceEn: '$349 one-time',
    priceEs: '$349 pago único',
    titleEn: 'Dental & Medical Clinics AI Pack',
    titleEs: 'Pack Clínicas (Dental, Estética y Kine)',
    guaranteeEn: '30 local treatment prompts + Medical/Dentist JSON-LD schema.',
    guaranteeEs: '30 prompts locales + schema Dentist/MedicalBusiness JSON-LD.',
    domainRequired: true,
    marketRequired: true,
  },
  law_pack: {
    sku: 'law_pack',
    mode: 'one_time',
    intakeProfile: 'audit',
    priceEn: '$499 one-time',
    priceEs: '$499 pago único',
    titleEn: 'Law & Advisory Practices Pack',
    titleEs: 'Pack Estudios Jurídicos y Asesoría',
    guaranteeEn: 'Practice-area AI audit + LegalService JSON-LD roadmap.',
    guaranteeEs: 'Auditoría por área de práctica + hoja de ruta LegalService JSON-LD.',
    domainRequired: true,
    marketRequired: true,
  },
  shopify_check: {
    sku: 'shopify_check',
    mode: 'one_time',
    intakeProfile: 'audit',
    priceEn: '$499 one-time',
    priceEs: '$499 pago único',
    titleEn: 'Shopify & Ecommerce AI Readiness',
    titleEs: 'Revisión Agentic Readiness Shopify',
    guaranteeEn: 'Catalog Product/Offer schema + ACP/UCP agentic checkout readiness.',
    guaranteeEs: 'Schema Product/Offer + compatibilidad ACP (ChatGPT) / UCP (Google).',
    domainRequired: true,
    marketRequired: true,
  },
  fix_sprint: {
    sku: 'fix_sprint',
    mode: 'one_time',
    intakeProfile: 'sprint',
    priceEn: '$499 one-time',
    priceEs: '$499 pago único',
    titleEn: 'Done-For-You Technical Fix Sprint',
    titleEs: 'Sprint de Implementación Done-For-You',
    guaranteeEn: 'We ship schema, llms.txt & answer-ready FAQ upgrades in 7 days.',
    guaranteeEs: 'Implementamos schema, llms.txt y FAQs citables en 7 días.',
    domainRequired: true,
    marketRequired: true,
  },
  agency_pilot_audit: {
    sku: 'agency_pilot_audit',
    mode: 'one_time',
    intakeProfile: 'agency',
    priceEn: '$149 wholesale',
    priceEs: '$149 mayorista',
    titleEn: 'Agency White-Label Pilot Audit',
    titleEs: 'Auditoría Piloto Marca Blanca (Agencias)',
    guaranteeEn: 'Ready to rebrand and deliver to your agency client in 48 hours.',
    guaranteeEs: 'Lista para rebrandear y entregar a tu cliente en 48 horas.',
    domainRequired: true,
    marketRequired: true,
  },
  agency_reaudit: {
    sku: 'agency_reaudit',
    mode: 'one_time',
    intakeProfile: 'agency',
    priceEn: '$99 wholesale',
    priceEs: '$99 mayorista',
    titleEn: 'Agency Verification Re-Audit',
    titleEs: 'Re-Auditoría Comparativa (Agencias)',
    guaranteeEn: 'Before/after comparison across your client’s frozen prompts.',
    guaranteeEs: 'Comparativa antes y después sobre los prompts fijos de tu cliente.',
    domainRequired: true,
    marketRequired: true,
  },
  portfolio_snapshot: {
    sku: 'portfolio_snapshot',
    mode: 'one_time',
    intakeProfile: 'portfolio',
    priceEn: '$1,500 one-time',
    priceEs: '$1,500 pago único',
    titleEn: 'Portfolio AI Answer Share Snapshot',
    titleEs: 'Diagnóstico AI Share para Portafolio',
    guaranteeEn: 'Consolidated benchmark across up to 10 companies.',
    guaranteeEs: 'Benchmark consolidado para hasta 10 empresas.',
    domainRequired: false,
    marketRequired: true,
  },
  watch_local: {
    sku: 'watch_local',
    mode: 'subscription',
    intakeProfile: 'watch_plan',
    priceEn: '$149 / month',
    priceEs: '$149 / mes',
    titleEn: 'Sondri Watch Local',
    titleEs: 'Sondri Watch Local',
    guaranteeEn: 'No lock-in. Month 4 free if frozen prompt share does not improve.',
    guaranteeEs: 'Sin permanencia forzosa. Mes 4 gratis si no sube tu cuota.',
    domainRequired: true,
    marketRequired: true,
  },
  watch_commerce: {
    sku: 'watch_commerce',
    mode: 'subscription',
    intakeProfile: 'watch_plan',
    priceEn: '$299 / month',
    priceEs: '$299 / mes',
    titleEn: 'Sondri Watch Commerce',
    titleEs: 'Sondri Watch Commerce',
    guaranteeEn: 'Weekly store & category tracking + 1 shipped fix every month.',
    guaranteeEs: 'Seguimiento semanal de tienda + 1 mejora implementada cada mes.',
    domainRequired: true,
    marketRequired: true,
  },
  watch_pro: {
    sku: 'watch_pro',
    mode: 'subscription',
    intakeProfile: 'watch_plan',
    priceEn: '$399 / month',
    priceEs: '$399 / mes',
    titleEn: 'Sondri Watch Pro',
    titleEs: 'Sondri Watch Pro',
    guaranteeEn: '75 buyer prompts, weekly 4-engine tracking & priority fixes shipped.',
    guaranteeEs: '75 prompts fijos, 4 motores semanales y mejoras prioritarias.',
    domainRequired: true,
    marketRequired: true,
  },
  watch_agency_client: {
    sku: 'watch_agency_client',
    mode: 'subscription',
    intakeProfile: 'agency',
    priceEn: '$79 / client / mo',
    priceEs: '$79 / cliente / mes',
    titleEn: 'Agency White-Label Client Monitor',
    titleEs: 'Monitoreo Marca Blanca por Cliente',
    guaranteeEn: 'Wholesale monthly reporting feed for your agency client.',
    guaranteeEs: 'Feed mensual mayorista marca blanca para tu cliente.',
    domainRequired: true,
    marketRequired: true,
  },
  website_quick_fix: {
    sku: 'website_quick_fix',
    mode: 'one_time',
    intakeProfile: 'website_fix',
    priceEn: '$390 one-time',
    priceEs: '$390 pago único',
    titleEn: 'Answer-Ready Website Quick Fix',
    titleEs: 'Website Quick Fix Answer-Ready',
    guaranteeEn: 'Speed tuning, llms.txt & JSON-LD shipped on your current site in 7 days.',
    guaranteeEs: 'Velocidad, llms.txt y JSON-LD en tu web actual en 7 días.',
    domainRequired: true,
    marketRequired: true,
  },
  website_5page: {
    sku: 'website_5page',
    mode: 'one_time',
    intakeProfile: 'website_build',
    priceEn: '$690 one-time',
    priceEs: '$690 pago único',
    titleEn: '5-Page Answer-Ready Website',
    titleEs: 'Sitio Web Answer-Ready de 5 Páginas',
    guaranteeEn: 'Fast 95+ Lighthouse build + full JSON-LD launched in 2 weeks.',
    guaranteeEs: 'Sitio rápido 95+ Lighthouse + JSON-LD completo en 2 semanas.',
    domainRequired: false,
    marketRequired: true,
  },
  website_10page: {
    sku: 'website_10page',
    mode: 'one_time',
    intakeProfile: 'website_build',
    priceEn: '$1,190 one-time',
    priceEs: '$1,190 pago único',
    titleEn: '10-Page Custom Growth & AEO Website',
    titleEs: 'Sitio Web Crecimiento y AEO de 10 Páginas',
    guaranteeEn: 'Bespoke architecture + dedicated service pages + AI listings sync.',
    guaranteeEs: 'Arquitectura a medida + páginas por servicio + sincronización IA.',
    domainRequired: false,
    marketRequired: true,
  },
};
