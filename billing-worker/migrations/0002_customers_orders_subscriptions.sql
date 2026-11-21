-- 0002: Operational billing, checkout intake, and Stripe subscription tracking

-- 1. Customers (unified identity linking domain/contact intake to Stripe Customer ID)
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
);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);

-- 2. Orders (tracks every checkout attempt including abandoned checkouts, paid orders, renewals, and refunds)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  offer_sku TEXT NOT NULL,
  order_type TEXT NOT NULL, -- 'one_time' | 'subscription' | 'renewal' | 'custom'
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'checkout_started', -- 'checkout_started' | 'paid' | 'expired' | 'refunded' | 'failed'
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
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_pi ON orders(stripe_payment_intent_id);

-- 3. Subscriptions (mirrors Stripe subscription lifecycle for monthly Watch retainers)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  offer_sku TEXT,
  domain TEXT,
  status TEXT NOT NULL, -- 'active' | 'past_due' | 'canceled' | 'trialing' | 'unpaid' | 'incomplete'
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
);
CREATE INDEX IF NOT EXISTS idx_subs_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);

-- 4. Webhook Events (idempotency guard against Stripe retry duplicates)
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
