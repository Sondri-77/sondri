export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  API_KEY: string;
  DISCORD_WEBHOOK_URL?: string;
  DISCORD_AEO_WEBHOOK_URL?: string;
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
  customInput?: boolean;
}

export interface LighthouseDiagnostic {
  id: string;
  title: string;
  displayValue?: string;
  score: number; // 0-100
}

export interface LighthouseResult {
  fetchedAt: string;
  strategy: 'mobile' | 'desktop';
  performanceScore: number | null; // 0-100
  seoScore: number | null; // 0-100
  accessibilityScore?: number | null; // 0-100
  bestPracticesScore?: number | null; // 0-100
  isCrawlable: boolean | null;
  fcpDisplay?: string;
  lcpDisplay?: string;
  tbtDisplay?: string;
  clsDisplay?: string;
  siDisplay?: string;
  ttfbDisplay?: string;
  diagnostics?: LighthouseDiagnostic[];
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
  customInput?: boolean;
}

export type OrderType = 'one_time' | 'subscription' | 'renewal' | 'custom';
export type OrderStatus = 'checkout_started' | 'paid' | 'expired' | 'refunded' | 'failed';

export interface CustomerRecord {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  primary_domain: string | null;
  city: string | null;
  service: string | null;
  lang: AuditLang;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderRecord {
  id: string;
  customer_id: string;
  offer_sku: string;
  order_type: OrderType;
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  domain: string | null;
  city: string | null;
  service: string | null;
  notes: string | null;
  audit_id: string | null;
  lang: AuditLang;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  receipt_url: string | null;
  invoice_url: string | null;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
}

export interface EnrichedOrderRecord extends OrderRecord {
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  stripe_customer_id: string | null;
}

export interface SubscriptionRecord {
  id: string;
  customer_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  offer_sku: string | null;
  domain: string | null;
  status: string;
  amount_cents: number | null;
  currency: string;
  interval: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  latest_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrichedSubscriptionRecord extends SubscriptionRecord {
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
}

export interface CustomerWithStats extends CustomerRecord {
  orders_count: number;
  paid_orders_count: number;
  total_paid_cents: number;
  active_subscriptions_count: number;
  last_order_at: string | null;
}

export interface AdminMetrics {
  total_paid_cents: number;
  paid_orders_count: number;
  abandoned_count: number;
  active_subscriptions_count: number;
  active_mrr_cents: number;
  customers_count: number;
}
