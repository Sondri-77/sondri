export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  API_KEY: string;
  DISCORD_WEBHOOK_URL?: string;
  GOOGLE_SHEETS_WEBHOOK_URL?: string;
  DB?: D1Database;
  GEMINI_API_KEY?: string;
  PAGESPEED_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  DAILY_AUDIT_CAP?: string;
}

export interface CreateCustomerDTO {
  name: string;
  email: string;
  client_id: string; // Internal Sondri client identifier
}

export interface CreateSubscriptionDTO {
  price_id: string; // Stripe Price ID for monthly/quarterly retainer
}

export interface CreateChargeDTO {
  amount: number; // In cents/pence (e.g. 50000 = $500.00)
  description: string; // e.g. "10 hrs AI Automation development (T&M)"
  currency?: string; // Default 'usd'
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export type AuditLang = 'en' | 'es';

export interface BotAccessStatus {
  bot: string;
  role: 'search' | 'training';
  allowed: boolean;
}

export interface TechScanResult {
  url: string;
  domain: string;
  reachable: boolean;
  statusCode: number;
  title: string;
  metaDescription: string;
  canonical: string | null;
  h1s: string[];
  h2s: string[];
  bodyExcerpt?: string;
  detectedBrand: string;
  inferredService: string;
  inferredCity: string;
  schemasFound: string[];
  hasOrganizationOrLocalBusiness: boolean;
  hasFaqSchema: boolean;
  hasPhoneInHtml: boolean;
  hasAddressSignals: boolean;
  robotsTxtFound: boolean;
  bots: BotAccessStatus[];
  llmsTxtFound: boolean;
  sitemapFound: boolean;
  readinessScore: number; // 0-100 technical readiness score
  gaps: string[];
}

export interface LighthouseResult {
  fetchedAt: string;
  strategy: 'mobile' | 'desktop';
  performanceScore: number | null; // 0-100
  seoScore: number | null; // 0-100
  isCrawlable: boolean | null;
  lcpDisplay?: string;
  clsDisplay?: string;
  error?: string;
}

export interface GroundedPromptRun {
  question: string;
  engine: 'gemini';
  status: 'ok' | 'not_run' | 'error';
  brandNamed: boolean;
  domainCited: boolean;
  competitorsNamed: string[];
  sourcesCited: { title: string; url: string; domain: string }[];
  answerExcerpt: string;
}

export interface AiVisibilityResult {
  ranAt: string;
  engine: 'gemini';
  totalQuestions: number;
  namedCount: number;
  citedCount: number;
  competitorsSummary: string[];
  topSourceDomains: string[];
  runs: GroundedPromptRun[];
  enginesNotRun: string[];
  circuitBreakerTripped?: boolean;
}
