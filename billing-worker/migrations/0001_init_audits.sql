-- 1. Domain audit cache (replaces external Redis/KV)
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
);
CREATE INDEX IF NOT EXISTS idx_audits_domain_exp ON audits(domain, expires_at);

-- 2. Captured leads & $99 Full Audit conversions
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
);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
CREATE INDEX IF NOT EXISTS idx_leads_audit_id ON leads(audit_id);

-- 3. Daily circuit-breaker & per-IP rate limiting
CREATE TABLE IF NOT EXISTS daily_usage (
  day TEXT NOT NULL,
  scope TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, scope)
);
