import { AiVisibilityResult, AuditLang, Env, LighthouseResult, TechScanResult } from '../types';

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
let schemaInitialized = false;

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
          email TEXT NOT NULL,
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

export async function getCachedAuditByDomain(
  env: Env,
  domain: string,
  lang: AuditLang
): Promise<StoredAudit | null> {
  await ensureSchema(env);
  const nowIso = new Date().toISOString();

  if (!env.DB) {
    for (const audit of memoryAudits.values()) {
      if (audit.domain === domain && audit.lang === lang && audit.expires_at > nowIso) {
        return audit;
      }
    }
    return null;
  }

  const row = await env.DB.prepare(
    `SELECT * FROM audits WHERE domain = ? AND lang = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1`
  )
    .bind(domain, lang, nowIso)
    .first<Record<string, any>>();

  return row ? rowToStoredAudit(row) : null;
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
    email: string;
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

export async function markLeadPaid99(
  env: Env,
  auditId: string | undefined,
  email: string | undefined,
  stripeSessionId: string
): Promise<void> {
  await ensureSchema(env);
  if (!env.DB) return;

  const nowIso = new Date().toISOString();
  if (auditId) {
    await env.DB.prepare(
      `UPDATE leads SET paid_99 = 1, stripe_session_id = ?, paid_at = ? WHERE audit_id = ?`
    )
      .bind(stripeSessionId, nowIso, auditId)
      .run();
  } else if (email) {
    await env.DB.prepare(
      `UPDATE leads SET paid_99 = 1, stripe_session_id = ?, paid_at = ? WHERE email = ?`
    )
      .bind(stripeSessionId, nowIso, email.toLowerCase().trim())
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
