import {
  AdminMetrics,
  AiVisibilityResult,
  AuditLang,
  CustomerRecord,
  CustomerWithStats,
  EnrichedOrderRecord,
  EnrichedSubscriptionRecord,
  Env,
  LighthouseResult,
  OrderRecord,
  OrderStatus,
  OrderType,
  SubscriptionRecord,
  TechScanResult,
} from '../types';

export interface StoredAudit {
  id: string;
  domain: string;
  url: string;
  lang: AuditLang;
  city: string;
  service: string;
  tech_scan: TechScanResult | null;
  lighthouse: LighthouseResult | null;
  questions: string[];
  ai_visibility: AiVisibilityResult | null;
  full_audit: AiVisibilityResult | null;
  created_at: string;
  expires_at: string;
}

// In-memory fallback when env.DB is not bound (e.g. unit tests)
const memoryAudits = new Map<string, StoredAudit>();
const memoryUsage = new Map<string, number>();
const memoryCustomers = new Map<string, CustomerRecord>();
const memoryOrders = new Map<string, OrderRecord>();
const memorySubscriptions = new Map<string, SubscriptionRecord>();
const memoryWebhookEvents = new Set<string>();
let schemaInitialized = false;

export function resetMemoryBillingStore(): void {
  memoryCustomers.clear();
  memoryOrders.clear();
  memorySubscriptions.clear();
  memoryWebhookEvents.clear();
}

export function resetMemoryAuditStore(): void {
  memoryAudits.clear();
  memoryUsage.clear();
}

async function ensureSchema(env: Env): Promise<void> {
  if (!env.DB || schemaInitialized) return;
  try {
    await env.DB.batch([
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS audits (
          id TEXT PRIMARY KEY,
          domain TEXT NOT NULL,
          url TEXT NOT NULL,
          lang TEXT NOT NULL DEFAULT 'en',
          city TEXT,
          service TEXT,
          tech_scan_json TEXT,
          lighthouse_json TEXT,
          questions_json TEXT,
          ai_visibility_json TEXT,
          full_audit_json TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          expires_at TEXT NOT NULL
        )
      `),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_audits_domain_exp ON audits(domain, expires_at)`),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT NOT NULL,
          phone TEXT,
          domain TEXT NOT NULL,
          city TEXT,
          service TEXT,
          lang TEXT NOT NULL DEFAULT 'en',
          audit_id TEXT,
          paid_99 INTEGER NOT NULL DEFAULT 0,
          stripe_session_id TEXT,
          ip_hash TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          paid_at TEXT
        )
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS daily_usage (
          day TEXT NOT NULL,
          scope TEXT NOT NULL,
          count INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (day, scope)
        )
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          phone TEXT,
          company TEXT,
          primary_domain TEXT,
          city TEXT,
          service TEXT,
          lang TEXT NOT NULL DEFAULT 'en',
          stripe_customer_id TEXT UNIQUE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id)`),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          offer_sku TEXT NOT NULL,
          order_type TEXT NOT NULL,
          amount_cents INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'usd',
          status TEXT NOT NULL DEFAULT 'checkout_started',
          domain TEXT,
          city TEXT,
          service TEXT,
          notes TEXT,
          audit_id TEXT,
          lang TEXT NOT NULL DEFAULT 'en',
          stripe_session_id TEXT UNIQUE,
          stripe_payment_intent_id TEXT,
          stripe_invoice_id TEXT,
          stripe_subscription_id TEXT,
          receipt_url TEXT,
          invoice_url TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          paid_at TEXT,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(stripe_session_id)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_pi ON orders(stripe_payment_intent_id)`),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          stripe_subscription_id TEXT NOT NULL UNIQUE,
          stripe_customer_id TEXT NOT NULL,
          offer_sku TEXT,
          domain TEXT,
          status TEXT NOT NULL,
          amount_cents INTEGER,
          currency TEXT NOT NULL DEFAULT 'usd',
          interval TEXT NOT NULL DEFAULT 'month',
          current_period_start TEXT,
          current_period_end TEXT,
          cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
          canceled_at TEXT,
          latest_invoice_id TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_subs_customer ON subscriptions(customer_id)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status)`),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS webhook_events (
          event_id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          processed_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `),
    ]);
    schemaInitialized = true;
  } catch (err) {
    console.warn('[D1 Schema Bootstrap Warning]', err);
  }
}

function rowToStoredAudit(row: Record<string, any>): StoredAudit {
  return {
    id: String(row.id),
    domain: String(row.domain),
    url: String(row.url),
    lang: (row.lang === 'es' ? 'es' : 'en') as AuditLang,
    city: String(row.city || ''),
    service: String(row.service || ''),
    tech_scan: row.tech_scan_json ? JSON.parse(String(row.tech_scan_json)) : null,
    lighthouse: row.lighthouse_json ? JSON.parse(String(row.lighthouse_json)) : null,
    questions: row.questions_json ? JSON.parse(String(row.questions_json)) : [],
    ai_visibility: row.ai_visibility_json ? JSON.parse(String(row.ai_visibility_json)) : null,
    full_audit: row.full_audit_json ? JSON.parse(String(row.full_audit_json)) : null,
    created_at: String(row.created_at),
    expires_at: String(row.expires_at),
  };
}

function isUsableCachedAudit(a: StoredAudit | null, expectedDefaultCity: string): a is StoredAudit {
  if (!a || !a.tech_scan || !a.ai_visibility) return false;
  if (a.tech_scan.customInput || a.ai_visibility.customInput) return false;
  if (a.city !== expectedDefaultCity) return false;
  if (a.tech_scan.inferredService && a.service !== a.tech_scan.inferredService) return false;
  if (a.ai_visibility.circuitBreakerTripped) return false;
  const runs = a.ai_visibility.runs || [];
  if (runs.length === 0 || runs.some((r) => r.status !== 'ok')) return false;
  return true;
}

export async function getCachedAuditByDomain(
  env: Env,
  domain: string,
  lang: AuditLang
): Promise<StoredAudit | null> {
  await ensureSchema(env);
  const nowIso = new Date().toISOString();
  const expectedDefaultCity = lang === 'es' ? 'Chile' : 'United States';

  if (!env.DB) {
    const candidates = Array.from(memoryAudits.values())
      .filter((a) => a.domain === domain && a.lang === lang && a.expires_at > nowIso)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    for (const audit of candidates) {
      if (isUsableCachedAudit(audit, expectedDefaultCity)) {
        return audit;
      }
    }
    return null;
  }

  const res = await env.DB.prepare(
    `SELECT * FROM audits WHERE domain = ? AND lang = ? AND city = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 10`
  )
    .bind(domain, lang, expectedDefaultCity, nowIso)
    .all<Record<string, any>>();

  for (const row of res.results || []) {
    const parsed = rowToStoredAudit(row);
    if (isUsableCachedAudit(parsed, expectedDefaultCity)) {
      return parsed;
    }
  }
  return null;
}

export async function getAuditById(env: Env, id: string): Promise<StoredAudit | null> {
  await ensureSchema(env);
  if (!env.DB) {
    return memoryAudits.get(id) || null;
  }
  const row = await env.DB.prepare(`SELECT * FROM audits WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<Record<string, any>>();
  return row ? rowToStoredAudit(row) : null;
}

export async function saveAuditStep1(
  env: Env,
  audit: StoredAudit
): Promise<void> {
  await ensureSchema(env);
  memoryAudits.set(audit.id, audit);
  if (!env.DB) return;

  await env.DB.prepare(
    `INSERT OR REPLACE INTO audits (
      id, domain, url, lang, city, service,
      tech_scan_json, lighthouse_json, questions_json, ai_visibility_json, full_audit_json,
      created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      audit.id,
      audit.domain,
      audit.url,
      audit.lang,
      audit.city,
      audit.service,
      audit.tech_scan ? JSON.stringify(audit.tech_scan) : null,
      audit.lighthouse ? JSON.stringify(audit.lighthouse) : null,
      JSON.stringify(audit.questions || []),
      audit.ai_visibility ? JSON.stringify(audit.ai_visibility) : null,
      audit.full_audit ? JSON.stringify(audit.full_audit) : null,
      audit.created_at,
      audit.expires_at
    )
    .run();
}

export async function updateAuditLighthouse(
  env: Env,
  auditId: string,
  lighthouse: LighthouseResult
): Promise<void> {
  await ensureSchema(env);
  const mem = memoryAudits.get(auditId);
  if (mem) mem.lighthouse = lighthouse;
  if (!env.DB) return;

  await env.DB.prepare(`UPDATE audits SET lighthouse_json = ? WHERE id = ?`)
    .bind(JSON.stringify(lighthouse), auditId)
    .run();
}

export async function updateAuditAiVisibility(
  env: Env,
  auditId: string,
  questions: string[],
  aiVisibility: AiVisibilityResult,
  city: string,
  service: string
): Promise<void> {
  await ensureSchema(env);
  const mem = memoryAudits.get(auditId);
  if (mem) {
    mem.questions = questions;
    mem.ai_visibility = aiVisibility;
    mem.city = city;
    mem.service = service;
  }
  if (!env.DB) return;

  await env.DB.prepare(
    `UPDATE audits SET questions_json = ?, ai_visibility_json = ?, city = ?, service = ? WHERE id = ?`
  )
    .bind(JSON.stringify(questions), JSON.stringify(aiVisibility), city, service, auditId)
    .run();
}

export async function updateAuditFullBaseline(
  env: Env,
  auditId: string,
  fullAudit: AiVisibilityResult
): Promise<void> {
  await ensureSchema(env);
  const mem = memoryAudits.get(auditId);
  if (mem) mem.full_audit = fullAudit;
  if (!env.DB) return;

  await env.DB.prepare(`UPDATE audits SET full_audit_json = ? WHERE id = ?`)
    .bind(JSON.stringify(fullAudit), auditId)
    .run();
}

export async function recordLead(
  env: Env,
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string;
    domain: string;
    city: string;
    service: string;
    lang: AuditLang;
    auditId: string;
    ipHash: string;
  }
): Promise<void> {
  await ensureSchema(env);
  if (!env.DB) return;

  try {
    await env.DB.prepare(
      `INSERT INTO leads (id, name, email, phone, domain, city, service, lang, audit_id, ip_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        lead.id,
        lead.name.trim(),
        lead.email.toLowerCase().trim(),
        lead.phone.trim(),
        lead.domain,
        lead.city,
        lead.service,
        lead.lang,
        lead.auditId,
        lead.ipHash,
        new Date().toISOString()
      )
      .run();
  } catch {
    // Fallback if existing local table was created prior to name/phone columns
    await env.DB.prepare(
      `INSERT INTO leads (id, email, domain, city, service, lang, audit_id, ip_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        lead.id,
        lead.email.toLowerCase().trim(),
        lead.domain,
        lead.city,
        lead.service,
        lead.lang,
        lead.auditId,
        lead.ipHash,
        new Date().toISOString()
      )
      .run();
  }
}

export async function markLeadPaid99(
  env: Env,
  auditId: string | undefined,
  email: string | undefined,
  stripeSessionId: string
): Promise<void> {
  await ensureSchema(env);
  if (!env.DB) return;

  const nowIso = new Date().toISOString();
  const cleanEmail = email?.toLowerCase().trim() || '';
  if (auditId && cleanEmail) {
    await env.DB.prepare(
      `UPDATE leads SET paid_99 = 1, stripe_session_id = ?, paid_at = ? WHERE audit_id = ? AND lower(email) = ?`
    )
      .bind(stripeSessionId, nowIso, auditId, cleanEmail)
      .run();
  } else if (auditId) {
    await env.DB.prepare(
      `UPDATE leads SET paid_99 = 1, stripe_session_id = ?, paid_at = ? WHERE audit_id = ?`
    )
      .bind(stripeSessionId, nowIso, auditId)
      .run();
  } else if (cleanEmail) {
    await env.DB.prepare(
      `UPDATE leads SET paid_99 = 1, stripe_session_id = ?, paid_at = ? WHERE lower(email) = ?`
    )
      .bind(stripeSessionId, nowIso, cleanEmail)
      .run();
  }
}

export async function checkAndIncrementAiUsage(
  env: Env,
  ipHash: string,
  maxPerIpPerDay: number = 3
): Promise<{ allowed: boolean; reason?: 'ip_rate_limit' | 'daily_cap' }> {
  await ensureSchema(env);
  const day = new Date().toISOString().slice(0, 10);
  const dailyCap = parseInt(env.DAILY_AUDIT_CAP || '50', 10) || 50;
  const globalScope = 'global_ai_runs';
  const ipScope = `ip:${ipHash}`;

  if (!env.DB) {
    const gKey = `${day}:${globalScope}`;
    const iKey = `${day}:${ipScope}`;
    const gCount = memoryUsage.get(gKey) || 0;
    const iCount = memoryUsage.get(iKey) || 0;
    if (iCount >= maxPerIpPerDay) return { allowed: false, reason: 'ip_rate_limit' };
    if (gCount >= dailyCap) return { allowed: false, reason: 'daily_cap' };
    memoryUsage.set(gKey, gCount + 1);
    memoryUsage.set(iKey, iCount + 1);
    return { allowed: true };
  }

  const globalRow = await env.DB.prepare(
    `SELECT count FROM daily_usage WHERE day = ? AND scope = ?`
  )
    .bind(day, globalScope)
    .first<{ count: number }>();

  const ipRow = await env.DB.prepare(
    `SELECT count FROM daily_usage WHERE day = ? AND scope = ?`
  )
    .bind(day, ipScope)
    .first<{ count: number }>();

  if ((ipRow?.count || 0) >= maxPerIpPerDay) {
    return { allowed: false, reason: 'ip_rate_limit' };
  }
  if ((globalRow?.count || 0) >= dailyCap) {
    return { allowed: false, reason: 'daily_cap' };
  }

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO daily_usage (day, scope, count) VALUES (?, ?, 1)
       ON CONFLICT(day, scope) DO UPDATE SET count = count + 1`
    ).bind(day, globalScope),
    env.DB.prepare(
      `INSERT INTO daily_usage (day, scope, count) VALUES (?, ?, 1)
       ON CONFLICT(day, scope) DO UPDATE SET count = count + 1`
    ).bind(day, ipScope),
  ]);

  return { allowed: true };
}

function genId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

function cleanStr(val?: string | null): string | null {
  const s = typeof val === 'string' ? val.trim() : '';
  return s ? s : null;
}

function rowToCustomer(row: Record<string, any>): CustomerRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    name: cleanStr(row.name),
    phone: cleanStr(row.phone),
    company: cleanStr(row.company),
    primary_domain: cleanStr(row.primary_domain),
    city: cleanStr(row.city),
    service: cleanStr(row.service),
    lang: (row.lang === 'es' ? 'es' : 'en') as AuditLang,
    stripe_customer_id: cleanStr(row.stripe_customer_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function rowToOrder(row: Record<string, any>): OrderRecord {
  return {
    id: String(row.id),
    customer_id: String(row.customer_id),
    offer_sku: String(row.offer_sku),
    order_type: String(row.order_type) as OrderType,
    amount_cents: Number(row.amount_cents || 0),
    currency: String(row.currency || 'usd'),
    status: String(row.status) as OrderStatus,
    domain: cleanStr(row.domain),
    city: cleanStr(row.city),
    service: cleanStr(row.service),
    notes: cleanStr(row.notes),
    audit_id: cleanStr(row.audit_id),
    lang: (row.lang === 'es' ? 'es' : 'en') as AuditLang,
    stripe_session_id: cleanStr(row.stripe_session_id),
    stripe_payment_intent_id: cleanStr(row.stripe_payment_intent_id),
    stripe_invoice_id: cleanStr(row.stripe_invoice_id),
    stripe_subscription_id: cleanStr(row.stripe_subscription_id),
    receipt_url: cleanStr(row.receipt_url),
    invoice_url: cleanStr(row.invoice_url),
    created_at: String(row.created_at),
    paid_at: cleanStr(row.paid_at),
    updated_at: String(row.updated_at),
  };
}

function rowToSubscription(row: Record<string, any>): SubscriptionRecord {
  return {
    id: String(row.id),
    customer_id: String(row.customer_id),
    stripe_subscription_id: String(row.stripe_subscription_id),
    stripe_customer_id: String(row.stripe_customer_id),
    offer_sku: cleanStr(row.offer_sku),
    domain: cleanStr(row.domain),
    status: String(row.status),
    amount_cents: row.amount_cents != null ? Number(row.amount_cents) : null,
    currency: String(row.currency || 'usd'),
    interval: String(row.interval || 'month'),
    current_period_start: cleanStr(row.current_period_start),
    current_period_end: cleanStr(row.current_period_end),
    cancel_at_period_end: Boolean(Number(row.cancel_at_period_end || 0)),
    canceled_at: cleanStr(row.canceled_at),
    latest_invoice_id: cleanStr(row.latest_invoice_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getCustomerByEmail(env: Env, email: string): Promise<CustomerRecord | null> {
  await ensureSchema(env);
  const norm = email.toLowerCase().trim();
  if (!norm) return null;

  if (!env.DB) {
    for (const c of memoryCustomers.values()) {
      if (c.email === norm) return c;
    }
    return null;
  }

  const row = await env.DB.prepare(`SELECT * FROM customers WHERE email = ? LIMIT 1`)
    .bind(norm)
    .first<Record<string, any>>();
  return row ? rowToCustomer(row) : null;
}

export async function getCustomerById(env: Env, id: string): Promise<CustomerRecord | null> {
  await ensureSchema(env);
  if (!id) return null;

  if (!env.DB) {
    return memoryCustomers.get(id) || null;
  }

  const row = await env.DB.prepare(`SELECT * FROM customers WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<Record<string, any>>();
  return row ? rowToCustomer(row) : null;
}

export async function getCustomerByStripeId(env: Env, stripeCustomerId: string): Promise<CustomerRecord | null> {
  await ensureSchema(env);
  if (!stripeCustomerId) return null;

  if (!env.DB) {
    for (const c of memoryCustomers.values()) {
      if (c.stripe_customer_id === stripeCustomerId) return c;
    }
    return null;
  }

  const row = await env.DB.prepare(`SELECT * FROM customers WHERE stripe_customer_id = ? LIMIT 1`)
    .bind(stripeCustomerId)
    .first<Record<string, any>>();
  return row ? rowToCustomer(row) : null;
}

export async function upsertCustomer(
  env: Env,
  input: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    company?: string | null;
    primary_domain?: string | null;
    city?: string | null;
    service?: string | null;
    lang?: AuditLang;
    stripe_customer_id?: string | null;
  }
): Promise<CustomerRecord> {
  await ensureSchema(env);
  const nowIso = new Date().toISOString();
  const normEmail = input.email ? input.email.toLowerCase().trim() : '';

  let existing: CustomerRecord | null = null;
  if (normEmail) existing = await getCustomerByEmail(env, normEmail);
  if (!existing && input.stripe_customer_id) {
    existing = await getCustomerByStripeId(env, input.stripe_customer_id);
  }

  if (existing) {
    const merged: CustomerRecord = {
      ...existing,
      email: normEmail || existing.email,
      name: cleanStr(input.name) ?? existing.name,
      phone: cleanStr(input.phone) ?? existing.phone,
      company: cleanStr(input.company) ?? existing.company,
      primary_domain: cleanStr(input.primary_domain) ?? existing.primary_domain,
      city: cleanStr(input.city) ?? existing.city,
      service: cleanStr(input.service) ?? existing.service,
      lang: input.lang || existing.lang,
      stripe_customer_id: cleanStr(input.stripe_customer_id) ?? existing.stripe_customer_id,
      updated_at: nowIso,
    };

    if (!env.DB) {
      memoryCustomers.set(merged.id, merged);
      return merged;
    }

    await env.DB.prepare(
      `UPDATE customers SET email = ?, name = ?, phone = ?, company = ?, primary_domain = ?, city = ?, service = ?, lang = ?, stripe_customer_id = ?, updated_at = ? WHERE id = ?`
    )
      .bind(
        merged.email,
        merged.name,
        merged.phone,
        merged.company,
        merged.primary_domain,
        merged.city,
        merged.service,
        merged.lang,
        merged.stripe_customer_id,
        merged.updated_at,
        merged.id
      )
      .run();
    return merged;
  }

  const created: CustomerRecord = {
    id: genId('cust'),
    email: normEmail || `unknown_${Date.now()}@placeholder.local`,
    name: cleanStr(input.name),
    phone: cleanStr(input.phone),
    company: cleanStr(input.company),
    primary_domain: cleanStr(input.primary_domain),
    city: cleanStr(input.city),
    service: cleanStr(input.service),
    lang: input.lang || 'en',
    stripe_customer_id: cleanStr(input.stripe_customer_id),
    created_at: nowIso,
    updated_at: nowIso,
  };

  if (!env.DB) {
    memoryCustomers.set(created.id, created);
    return created;
  }

  await env.DB.prepare(
    `INSERT INTO customers (id, email, name, phone, company, primary_domain, city, service, lang, stripe_customer_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      created.id,
      created.email,
      created.name,
      created.phone,
      created.company,
      created.primary_domain,
      created.city,
      created.service,
      created.lang,
      created.stripe_customer_id,
      created.created_at,
      created.updated_at
    )
    .run();

  return created;
}

export async function findOrCreateCustomerForCheckout(
  env: Env,
  input: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    company?: string | null;
    primary_domain?: string | null;
    city?: string | null;
    service?: string | null;
    lang?: AuditLang;
  }
): Promise<CustomerRecord> {
  await ensureSchema(env);
  const normEmail = input.email ? input.email.toLowerCase().trim() : '';
  if (normEmail) {
    const existing = await getCustomerByEmail(env, normEmail);
    if (existing) {
      return existing;
    }
  }
  return upsertCustomer(env, {
    ...input,
    stripe_customer_id: null,
  });
}

export async function createCheckoutOrder(
  env: Env,
  input: {
    customer_id: string;
    offer_sku: string;
    order_type: OrderType;
    amount_cents: number;
    currency?: string;
    status?: OrderStatus;
    domain?: string | null;
    city?: string | null;
    service?: string | null;
    notes?: string | null;
    audit_id?: string | null;
    lang?: AuditLang;
    stripe_session_id?: string | null;
    stripe_payment_intent_id?: string | null;
    stripe_invoice_id?: string | null;
    stripe_subscription_id?: string | null;
    receipt_url?: string | null;
    invoice_url?: string | null;
    paid_at?: string | null;
  }
): Promise<OrderRecord> {
  await ensureSchema(env);
  const nowIso = new Date().toISOString();
  const order: OrderRecord = {
    id: genId('ord'),
    customer_id: input.customer_id,
    offer_sku: input.offer_sku,
    order_type: input.order_type,
    amount_cents: Math.round(input.amount_cents),
    currency: (input.currency || 'usd').toLowerCase(),
    status: input.status || 'checkout_started',
    domain: cleanStr(input.domain),
    city: cleanStr(input.city),
    service: cleanStr(input.service),
    notes: cleanStr(input.notes),
    audit_id: cleanStr(input.audit_id),
    lang: input.lang || 'en',
    stripe_session_id: cleanStr(input.stripe_session_id),
    stripe_payment_intent_id: cleanStr(input.stripe_payment_intent_id),
    stripe_invoice_id: cleanStr(input.stripe_invoice_id),
    stripe_subscription_id: cleanStr(input.stripe_subscription_id),
    receipt_url: cleanStr(input.receipt_url),
    invoice_url: cleanStr(input.invoice_url),
    created_at: nowIso,
    paid_at: cleanStr(input.paid_at),
    updated_at: nowIso,
  };

  if (!env.DB) {
    memoryOrders.set(order.id, order);
    return order;
  }

  await env.DB.prepare(
    `INSERT INTO orders (
      id, customer_id, offer_sku, order_type, amount_cents, currency, status,
      domain, city, service, notes, audit_id, lang,
      stripe_session_id, stripe_payment_intent_id, stripe_invoice_id, stripe_subscription_id,
      receipt_url, invoice_url, created_at, paid_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      order.id,
      order.customer_id,
      order.offer_sku,
      order.order_type,
      order.amount_cents,
      order.currency,
      order.status,
      order.domain,
      order.city,
      order.service,
      order.notes,
      order.audit_id,
      order.lang,
      order.stripe_session_id,
      order.stripe_payment_intent_id,
      order.stripe_invoice_id,
      order.stripe_subscription_id,
      order.receipt_url,
      order.invoice_url,
      order.created_at,
      order.paid_at,
      order.updated_at
    )
    .run();

  return order;
}

export async function attachStripeSessionToOrder(
  env: Env,
  orderId: string,
  sessionId: string
): Promise<void> {
  await ensureSchema(env);
  const nowIso = new Date().toISOString();

  if (!env.DB) {
    const o = memoryOrders.get(orderId);
    if (o) {
      o.stripe_session_id = sessionId;
      o.updated_at = nowIso;
    }
    return;
  }

  await env.DB.prepare(`UPDATE orders SET stripe_session_id = ?, updated_at = ? WHERE id = ?`)
    .bind(sessionId, nowIso, orderId)
    .run();
}

export async function getOrderBySessionId(env: Env, sessionId: string): Promise<OrderRecord | null> {
  await ensureSchema(env);
  if (!sessionId) return null;

  if (!env.DB) {
    for (const o of memoryOrders.values()) {
      if (o.stripe_session_id === sessionId) return o;
    }
    return null;
  }

  const row = await env.DB.prepare(`SELECT * FROM orders WHERE stripe_session_id = ? LIMIT 1`)
    .bind(sessionId)
    .first<Record<string, any>>();
  return row ? rowToOrder(row) : null;
}

export async function markOrderPaid(
  env: Env,
  sessionId: string,
  patch: {
    stripe_payment_intent_id?: string | null;
    stripe_invoice_id?: string | null;
    stripe_subscription_id?: string | null;
    receipt_url?: string | null;
    invoice_url?: string | null;
    paid_at?: string | null;
    fallback?: {
      customer_id: string;
      offer_sku: string;
      order_type: OrderType;
      amount_cents: number;
      currency?: string;
      domain?: string | null;
      city?: string | null;
      service?: string | null;
      notes?: string | null;
      audit_id?: string | null;
      lang?: AuditLang;
    };
  }
): Promise<OrderRecord | null> {
  await ensureSchema(env);
  const existing = await getOrderBySessionId(env, sessionId);
  const nowIso = new Date().toISOString();
  const paidAt = patch.paid_at || nowIso;

  if (!existing) {
    if (!patch.fallback) return null;
    return createCheckoutOrder(env, {
      ...patch.fallback,
      status: 'paid',
      stripe_session_id: sessionId,
      stripe_payment_intent_id: patch.stripe_payment_intent_id,
      stripe_invoice_id: patch.stripe_invoice_id,
      stripe_subscription_id: patch.stripe_subscription_id,
      receipt_url: patch.receipt_url,
      invoice_url: patch.invoice_url,
      paid_at: paidAt,
    });
  }

  const updated: OrderRecord = {
    ...existing,
    status: 'paid',
    stripe_payment_intent_id: cleanStr(patch.stripe_payment_intent_id) ?? existing.stripe_payment_intent_id,
    stripe_invoice_id: cleanStr(patch.stripe_invoice_id) ?? existing.stripe_invoice_id,
    stripe_subscription_id: cleanStr(patch.stripe_subscription_id) ?? existing.stripe_subscription_id,
    receipt_url: cleanStr(patch.receipt_url) ?? existing.receipt_url,
    invoice_url: cleanStr(patch.invoice_url) ?? existing.invoice_url,
    paid_at: existing.paid_at || paidAt,
    updated_at: nowIso,
  };

  if (!env.DB) {
    memoryOrders.set(updated.id, updated);
    return updated;
  }

  await env.DB.prepare(
    `UPDATE orders SET status = 'paid', stripe_payment_intent_id = ?, stripe_invoice_id = ?, stripe_subscription_id = ?, receipt_url = ?, invoice_url = ?, paid_at = ?, updated_at = ? WHERE id = ?`
  )
    .bind(
      updated.stripe_payment_intent_id,
      updated.stripe_invoice_id,
      updated.stripe_subscription_id,
      updated.receipt_url,
      updated.invoice_url,
      updated.paid_at,
      updated.updated_at,
      updated.id
    )
    .run();

  return updated;
}

export async function markOrderExpired(env: Env, sessionId: string): Promise<OrderRecord | null> {
  await ensureSchema(env);
  const existing = await getOrderBySessionId(env, sessionId);
  if (!existing || existing.status === 'paid' || existing.status === 'refunded') {
    return existing;
  }
  const nowIso = new Date().toISOString();

  if (!env.DB) {
    existing.status = 'expired';
    existing.updated_at = nowIso;
    memoryOrders.set(existing.id, existing);
    return existing;
  }

  await env.DB.prepare(
    `UPDATE orders SET status = 'expired', updated_at = ? WHERE stripe_session_id = ? AND status = 'checkout_started'`
  )
    .bind(nowIso, sessionId)
    .run();
  return { ...existing, status: 'expired', updated_at: nowIso };
}

export async function markOrderRefundedByPaymentIntent(
  env: Env,
  paymentIntentId: string
): Promise<OrderRecord | null> {
  await ensureSchema(env);
  if (!paymentIntentId) return null;
  const nowIso = new Date().toISOString();

  if (!env.DB) {
    for (const o of memoryOrders.values()) {
      if (o.stripe_payment_intent_id === paymentIntentId) {
        o.status = 'refunded';
        o.updated_at = nowIso;
        return o;
      }
    }
    return null;
  }

  await env.DB.prepare(
    `UPDATE orders SET status = 'refunded', updated_at = ? WHERE stripe_payment_intent_id = ?`
  )
    .bind(nowIso, paymentIntentId)
    .run();

  const row = await env.DB.prepare(`SELECT * FROM orders WHERE stripe_payment_intent_id = ? LIMIT 1`)
    .bind(paymentIntentId)
    .first<Record<string, any>>();
  return row ? rowToOrder(row) : null;
}

export async function recordRenewalOrder(
  env: Env,
  input: {
    customer_id: string;
    offer_sku: string;
    amount_cents: number;
    currency?: string;
    domain?: string | null;
    stripe_payment_intent_id?: string | null;
    stripe_invoice_id: string;
    stripe_subscription_id?: string | null;
    receipt_url?: string | null;
    invoice_url?: string | null;
  }
): Promise<OrderRecord> {
  await ensureSchema(env);
  if (!env.DB) {
    for (const o of memoryOrders.values()) {
      if (o.stripe_invoice_id === input.stripe_invoice_id) return o;
    }
  } else {
    const existingRow = await env.DB.prepare(`SELECT * FROM orders WHERE stripe_invoice_id = ? LIMIT 1`)
      .bind(input.stripe_invoice_id)
      .first<Record<string, any>>();
    if (existingRow) return rowToOrder(existingRow);
  }

  return createCheckoutOrder(env, {
    customer_id: input.customer_id,
    offer_sku: input.offer_sku,
    order_type: 'renewal',
    amount_cents: input.amount_cents,
    currency: input.currency || 'usd',
    status: 'paid',
    domain: input.domain,
    stripe_payment_intent_id: input.stripe_payment_intent_id,
    stripe_invoice_id: input.stripe_invoice_id,
    stripe_subscription_id: input.stripe_subscription_id,
    receipt_url: input.receipt_url,
    invoice_url: input.invoice_url,
    paid_at: new Date().toISOString(),
  });
}

export async function getSubscriptionByStripeId(
  env: Env,
  stripeSubId: string
): Promise<SubscriptionRecord | null> {
  await ensureSchema(env);
  if (!stripeSubId) return null;

  if (!env.DB) {
    for (const s of memorySubscriptions.values()) {
      if (s.stripe_subscription_id === stripeSubId) return s;
    }
    return null;
  }

  const row = await env.DB.prepare(`SELECT * FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1`)
    .bind(stripeSubId)
    .first<Record<string, any>>();
  return row ? rowToSubscription(row) : null;
}

export async function upsertSubscription(
  env: Env,
  input: {
    customer_id: string;
    stripe_subscription_id: string;
    stripe_customer_id: string;
    offer_sku?: string | null;
    domain?: string | null;
    status: string;
    amount_cents?: number | null;
    currency?: string;
    interval?: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
    canceled_at?: string | null;
    latest_invoice_id?: string | null;
  }
): Promise<SubscriptionRecord> {
  await ensureSchema(env);
  const nowIso = new Date().toISOString();
  const existing = await getSubscriptionByStripeId(env, input.stripe_subscription_id);

  const sub: SubscriptionRecord = {
    id: existing?.id || genId('sub'),
    customer_id: input.customer_id || existing?.customer_id || '',
    stripe_subscription_id: input.stripe_subscription_id,
    stripe_customer_id: input.stripe_customer_id || existing?.stripe_customer_id || '',
    offer_sku: cleanStr(input.offer_sku) ?? existing?.offer_sku ?? null,
    domain: cleanStr(input.domain) ?? existing?.domain ?? null,
    status: input.status,
    amount_cents: input.amount_cents ?? existing?.amount_cents ?? null,
    currency: (input.currency || existing?.currency || 'usd').toLowerCase(),
    interval: input.interval || existing?.interval || 'month',
    current_period_start: cleanStr(input.current_period_start) ?? existing?.current_period_start ?? null,
    current_period_end: cleanStr(input.current_period_end) ?? existing?.current_period_end ?? null,
    cancel_at_period_end:
      input.cancel_at_period_end !== undefined
        ? Boolean(input.cancel_at_period_end)
        : existing?.cancel_at_period_end ?? false,
    canceled_at: cleanStr(input.canceled_at) ?? existing?.canceled_at ?? null,
    latest_invoice_id: cleanStr(input.latest_invoice_id) ?? existing?.latest_invoice_id ?? null,
    created_at: existing?.created_at || nowIso,
    updated_at: nowIso,
  };

  if (!env.DB) {
    memorySubscriptions.set(sub.id, sub);
    return sub;
  }

  await env.DB.prepare(
    `INSERT INTO subscriptions (
      id, customer_id, stripe_subscription_id, stripe_customer_id,
      offer_sku, domain, status, amount_cents, currency, interval,
      current_period_start, current_period_end, cancel_at_period_end, canceled_at, latest_invoice_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(stripe_subscription_id) DO UPDATE SET
      customer_id = excluded.customer_id,
      stripe_customer_id = excluded.stripe_customer_id,
      offer_sku = COALESCE(excluded.offer_sku, subscriptions.offer_sku),
      domain = COALESCE(excluded.domain, subscriptions.domain),
      status = excluded.status,
      amount_cents = COALESCE(excluded.amount_cents, subscriptions.amount_cents),
      currency = excluded.currency,
      interval = excluded.interval,
      current_period_start = COALESCE(excluded.current_period_start, subscriptions.current_period_start),
      current_period_end = COALESCE(excluded.current_period_end, subscriptions.current_period_end),
      cancel_at_period_end = excluded.cancel_at_period_end,
      canceled_at = COALESCE(excluded.canceled_at, subscriptions.canceled_at),
      latest_invoice_id = COALESCE(excluded.latest_invoice_id, subscriptions.latest_invoice_id),
      updated_at = excluded.updated_at`
  )
    .bind(
      sub.id,
      sub.customer_id,
      sub.stripe_subscription_id,
      sub.stripe_customer_id,
      sub.offer_sku,
      sub.domain,
      sub.status,
      sub.amount_cents,
      sub.currency,
      sub.interval,
      sub.current_period_start,
      sub.current_period_end,
      sub.cancel_at_period_end ? 1 : 0,
      sub.canceled_at,
      sub.latest_invoice_id,
      sub.created_at,
      sub.updated_at
    )
    .run();

  return sub;
}

export async function markSubscriptionStatus(
  env: Env,
  stripeSubId: string,
  status: string,
  extra?: { canceled_at?: string | null; latest_invoice_id?: string | null }
): Promise<SubscriptionRecord | null> {
  await ensureSchema(env);
  const existing = await getSubscriptionByStripeId(env, stripeSubId);
  if (!existing) return null;

  return upsertSubscription(env, {
    customer_id: existing.customer_id,
    stripe_subscription_id: existing.stripe_subscription_id,
    stripe_customer_id: existing.stripe_customer_id,
    offer_sku: existing.offer_sku,
    domain: existing.domain,
    status,
    canceled_at: extra?.canceled_at ?? existing.canceled_at,
    latest_invoice_id: extra?.latest_invoice_id ?? existing.latest_invoice_id,
  });
}

export async function recordWebhookEventOnce(
  env: Env,
  eventId: string,
  eventType: string
): Promise<boolean> {
  await ensureSchema(env);
  if (!eventId) return true;

  if (!env.DB) {
    if (memoryWebhookEvents.has(eventId)) return false;
    memoryWebhookEvents.add(eventId);
    return true;
  }

  const res = await env.DB.prepare(
    `INSERT OR IGNORE INTO webhook_events (event_id, event_type, processed_at) VALUES (?, ?, ?)`
  )
    .bind(eventId, eventType, new Date().toISOString())
    .run();
  return Number(res.meta?.changes ?? 0) > 0;
}

export async function deleteWebhookEvent(env: Env, eventId: string): Promise<void> {
  await ensureSchema(env);
  if (!eventId) return;

  if (!env.DB) {
    memoryWebhookEvents.delete(eventId);
    return;
  }

  await env.DB.prepare(`DELETE FROM webhook_events WHERE event_id = ?`)
    .bind(eventId)
    .run();
}

export async function listOrders(
  env: Env,
  filters: { status?: string; offer_sku?: string; q?: string; limit?: number } = {}
): Promise<EnrichedOrderRecord[]> {
  await ensureSchema(env);
  const limit = Math.min(500, Math.max(1, filters.limit ?? 100));
  const q = cleanStr(filters.q)?.toLowerCase() || '';

  if (!env.DB) {
    const out: EnrichedOrderRecord[] = [];
    for (const o of memoryOrders.values()) {
      if (filters.status && o.status !== filters.status) continue;
      if (filters.offer_sku && o.offer_sku !== filters.offer_sku) continue;
      const c = memoryCustomers.get(o.customer_id);
      const enriched: EnrichedOrderRecord = {
        ...o,
        customer_email: c?.email || '',
        customer_name: c?.name || null,
        customer_phone: c?.phone || null,
        stripe_customer_id: c?.stripe_customer_id || null,
      };
      if (q) {
        const hay = [
          enriched.customer_email,
          enriched.customer_name || '',
          enriched.domain || '',
          enriched.offer_sku,
          enriched.id,
          enriched.stripe_session_id || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }
      out.push(enriched);
    }
    return out.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  }

  const clauses: string[] = [];
  const binds: any[] = [];
  if (filters.status) {
    clauses.push(`o.status = ?`);
    binds.push(filters.status);
  }
  if (filters.offer_sku) {
    clauses.push(`o.offer_sku = ?`);
    binds.push(filters.offer_sku);
  }
  if (q) {
    const like = `%${q}%`;
    clauses.push(
      `(LOWER(COALESCE(c.email, '')) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ? OR LOWER(COALESCE(o.domain, '')) LIKE ? OR LOWER(o.offer_sku) LIKE ? OR LOWER(o.id) LIKE ?)`
    );
    binds.push(like, like, like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `
    SELECT o.*, c.email AS customer_email, c.name AS customer_name, c.phone AS customer_phone, c.stripe_customer_id AS stripe_customer_id
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT ?
  `;
  const { results } = await env.DB.prepare(sql)
    .bind(...binds, limit)
    .all<Record<string, any>>();

  return (results || []).map((r) => ({
    ...rowToOrder(r),
    customer_email: String(r.customer_email || ''),
    customer_name: cleanStr(r.customer_name),
    customer_phone: cleanStr(r.customer_phone),
    stripe_customer_id: cleanStr(r.stripe_customer_id),
  }));
}

export async function listSubscriptions(
  env: Env,
  filters: { status?: string; q?: string; limit?: number } = {}
): Promise<EnrichedSubscriptionRecord[]> {
  await ensureSchema(env);
  const limit = Math.min(500, Math.max(1, filters.limit ?? 100));
  const q = cleanStr(filters.q)?.toLowerCase() || '';

  if (!env.DB) {
    const out: EnrichedSubscriptionRecord[] = [];
    for (const s of memorySubscriptions.values()) {
      if (filters.status && s.status !== filters.status) continue;
      const c = memoryCustomers.get(s.customer_id);
      const enriched: EnrichedSubscriptionRecord = {
        ...s,
        customer_email: c?.email || '',
        customer_name: c?.name || null,
        customer_phone: c?.phone || null,
      };
      if (q) {
        const hay = [
          enriched.customer_email,
          enriched.customer_name || '',
          enriched.domain || '',
          enriched.offer_sku || '',
          enriched.stripe_subscription_id,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }
      out.push(enriched);
    }
    return out.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  }

  const clauses: string[] = [];
  const binds: any[] = [];
  if (filters.status) {
    clauses.push(`s.status = ?`);
    binds.push(filters.status);
  }
  if (q) {
    const like = `%${q}%`;
    clauses.push(
      `(LOWER(COALESCE(c.email, '')) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ? OR LOWER(COALESCE(s.domain, '')) LIKE ? OR LOWER(COALESCE(s.offer_sku, '')) LIKE ?)`
    );
    binds.push(like, like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `
    SELECT s.*, c.email AS customer_email, c.name AS customer_name, c.phone AS customer_phone
    FROM subscriptions s
    LEFT JOIN customers c ON c.id = s.customer_id
    ${where}
    ORDER BY s.updated_at DESC
    LIMIT ?
  `;
  const { results } = await env.DB.prepare(sql)
    .bind(...binds, limit)
    .all<Record<string, any>>();

  return (results || []).map((r) => ({
    ...rowToSubscription(r),
    customer_email: String(r.customer_email || ''),
    customer_name: cleanStr(r.customer_name),
    customer_phone: cleanStr(r.customer_phone),
  }));
}

export async function listCustomersWithStats(
  env: Env,
  filters: { email?: string; q?: string; limit?: number } = {}
): Promise<CustomerWithStats[]> {
  await ensureSchema(env);
  const limit = Math.min(500, Math.max(1, filters.limit ?? 100));
  const emailFilter = cleanStr(filters.email)?.toLowerCase() || '';
  const q = cleanStr(filters.q)?.toLowerCase() || '';

  if (!env.DB) {
    const out: CustomerWithStats[] = [];
    for (const c of memoryCustomers.values()) {
      if (emailFilter && c.email !== emailFilter) continue;
      if (q) {
        const hay = [c.email, c.name || '', c.primary_domain || '', c.city || '', c.service || '']
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }
      let ordersCount = 0;
      let paidCount = 0;
      let totalPaid = 0;
      let lastOrderAt: string | null = null;
      for (const o of memoryOrders.values()) {
        if (o.customer_id !== c.id) continue;
        ordersCount++;
        if (o.status === 'paid') {
          paidCount++;
          totalPaid += o.amount_cents;
        }
        if (!lastOrderAt || o.created_at > lastOrderAt) lastOrderAt = o.created_at;
      }
      let activeSubs = 0;
      for (const s of memorySubscriptions.values()) {
        if (s.customer_id === c.id && (s.status === 'active' || s.status === 'trialing')) {
          activeSubs++;
        }
      }
      out.push({
        ...c,
        orders_count: ordersCount,
        paid_orders_count: paidCount,
        total_paid_cents: totalPaid,
        active_subscriptions_count: activeSubs,
        last_order_at: lastOrderAt,
      });
    }
    return out.sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, limit);
  }

  const clauses: string[] = [];
  const binds: any[] = [];
  if (emailFilter) {
    clauses.push(`c.email = ?`);
    binds.push(emailFilter);
  }
  if (q) {
    const like = `%${q}%`;
    clauses.push(
      `(LOWER(c.email) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ? OR LOWER(COALESCE(c.primary_domain, '')) LIKE ? OR LOWER(COALESCE(c.city, '')) LIKE ? OR LOWER(COALESCE(c.service, '')) LIKE ?)`
    );
    binds.push(like, like, like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `
    SELECT c.*,
      COALESCE(COUNT(DISTINCT o.id), 0) AS orders_count,
      COALESCE(SUM(CASE WHEN o.status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders_count,
      COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.amount_cents ELSE 0 END), 0) AS total_paid_cents,
      COALESCE((SELECT COUNT(*) FROM subscriptions s WHERE s.customer_id = c.id AND s.status IN ('active', 'trialing')), 0) AS active_subscriptions_count,
      MAX(o.created_at) AS last_order_at
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    ${where}
    GROUP BY c.id
    ORDER BY c.updated_at DESC
    LIMIT ?
  `;
  const { results } = await env.DB.prepare(sql)
    .bind(...binds, limit)
    .all<Record<string, any>>();

  return (results || []).map((r) => ({
    ...rowToCustomer(r),
    orders_count: Number(r.orders_count || 0),
    paid_orders_count: Number(r.paid_orders_count || 0),
    total_paid_cents: Number(r.total_paid_cents || 0),
    active_subscriptions_count: Number(r.active_subscriptions_count || 0),
    last_order_at: cleanStr(r.last_order_at),
  }));
}

export async function getAdminMetrics(env: Env): Promise<AdminMetrics> {
  await ensureSchema(env);

  if (!env.DB) {
    let totalPaid = 0;
    let paidOrders = 0;
    let abandoned = 0;
    let activeSubs = 0;
    let activeMrr = 0;
    for (const o of memoryOrders.values()) {
      if (o.status === 'paid') {
        paidOrders++;
        totalPaid += o.amount_cents;
      } else if (o.status === 'expired' || o.status === 'checkout_started') {
        abandoned++;
      }
    }
    for (const s of memorySubscriptions.values()) {
      if (s.status === 'active' || s.status === 'trialing') {
        activeSubs++;
        activeMrr += s.amount_cents || 0;
      }
    }
    return {
      total_paid_cents: totalPaid,
      paid_orders_count: paidOrders,
      abandoned_count: abandoned,
      active_subscriptions_count: activeSubs,
      active_mrr_cents: activeMrr,
      customers_count: memoryCustomers.size,
    };
  }

  const orderAgg = await env.DB.prepare(
    `SELECT
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0) AS total_paid_cents,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders_count,
      COALESCE(SUM(CASE WHEN status IN ('expired', 'checkout_started') THEN 1 ELSE 0 END), 0) AS abandoned_count
     FROM orders`
  ).first<Record<string, any>>();

  const subAgg = await env.DB.prepare(
    `SELECT
      COALESCE(COUNT(*), 0) AS active_subscriptions_count,
      COALESCE(SUM(COALESCE(amount_cents, 0)), 0) AS active_mrr_cents
     FROM subscriptions
     WHERE status IN ('active', 'trialing')`
  ).first<Record<string, any>>();

  const custAgg = await env.DB.prepare(`SELECT COUNT(*) AS customers_count FROM customers`).first<Record<string, any>>();

  return {
    total_paid_cents: Number(orderAgg?.total_paid_cents || 0),
    paid_orders_count: Number(orderAgg?.paid_orders_count || 0),
    abandoned_count: Number(orderAgg?.abandoned_count || 0),
    active_subscriptions_count: Number(subAgg?.active_subscriptions_count || 0),
    active_mrr_cents: Number(subAgg?.active_mrr_cents || 0),
    customers_count: Number(custAgg?.customers_count || 0),
  };
}
