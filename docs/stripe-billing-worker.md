# Sondri Stripe Billing Worker — Architecture & Operations Guide

This document covers the complete architecture, API reference, developer testing setup, and production deployment guide for Sondri's Cloudflare Billing Worker (`billing-worker`).

---

## 1. Architecture Overview

The `sondri-billing-worker` acts as a secure, dedicated API proxy and webhook receiver for all Stripe billing operations. 

```
sondri.ai (Astro Site / Admin CLI)
          │
          │  HTTPS + X-API-Key
          ▼
billing.sondri.ai (Cloudflare Worker — TypeScript)
          │
          ├── Stripe API (Customers, Subscriptions, InvoiceItems, Invoices)
          └── Stripe Webhooks → /webhooks/stripe ──► Team Discord Channel
```

### Key Principles
- **Secret Isolation**: `STRIPE_SECRET_KEY` lives strictly inside Cloudflare Worker Secrets and is never exposed to the frontend.
- **Single Source of Truth**: Stripe acts as the database for customers, retainers, and invoice items (`1 Sondri Client = 1 Stripe Customer ID`).
- **Net 14 Invoice Emailing**: Retainers and variable charges are billed under Net 14 payment terms (`collection_method: 'send_invoice'`). Clients receive hosted PDF payment links via email.
- **Discord Real-time Alerts**: Webhooks (`invoice.paid`, `invoice.payment_failed`) send instant alerts to your team's Discord channel.

---

## 2. Environment Variables & Secrets

Local secrets are stored in `billing-worker/.dev.vars` (do NOT commit this file to git). Production secrets are set via `wrangler secret put`.

| Variable | Description | Example Value |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe API Secret Key | `sk_test_51...` / `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret | `whsec_...` |
| `API_KEY` | Shared secret authorizing API requests | `sondri_sec_key_xyz123` |
| `DISCORD_WEBHOOK_URL` | *(Optional)* Discord Webhook URL for alerts | `https://discord.com/api/webhooks/...` |

---

## 3. API Endpoint Reference

All endpoints except `/webhooks/stripe` require the header:
```http
X-API-Key: <your_api_key>
Content-Type: application/json
```

### Endpoints Table

| Method | Endpoint Path | Description |
|---|---|---|
| `POST` | `/customers` | Onboard a new client as a Stripe Customer |
| `GET` | `/customers/:id` | Get customer details and active retainer subscription status |
| `POST` | `/customers/:id/subscription` | Create a monthly retainer subscription (Net 14 terms) |
| `POST` | `/customers/:id/charges` | Log a variable charge (`InvoiceItem` for T&M or ad-hoc work) |
| `POST` | `/customers/:id/invoices` | Create, finalize, and email a Net 14 invoice for all pending items |
| `GET` | `/customers/:id/invoices` | List all past invoices for a customer |
| `POST` | `/webhooks/stripe` | Stripe Webhook handler (verified via `Stripe-Signature`) |

---

### Example `curl` Commands

#### 1. Onboard a New Client (`POST /customers`)
```bash
curl -X POST http://localhost:8787/customers \
  -H "X-API-Key: sondri_dev_secret_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "email": "billing@acme.com",
    "client_id": "acme-001"
  }'
```

#### 2. Create Retainer Subscription (`POST /customers/:id/subscription`)
```bash
curl -X POST http://localhost:8787/customers/cus_Rxxx123/subscription \
  -H "X-API-Key: sondri_dev_secret_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "price_id": "price_1Qxxx..."
  }'
```

#### 3. Log a Variable Charge / T&M Work (`POST /customers/:id/charges`)
```bash
curl -X POST http://localhost:8787/customers/cus_Rxxx123/charges \
  -H "X-API-Key: sondri_dev_secret_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "description": "10 hrs custom AI workflow automation (T&M)",
    "currency": "usd"
  }'
```
*(Note: `amount` is in cents/pence, e.g. 50000 = $500.00)*

#### 4. Finalize & Email Net 14 Invoice (`POST /customers/:id/invoices`)
```bash
curl -X POST http://localhost:8787/customers/cus_Rxxx123/invoices \
  -H "X-API-Key: sondri_dev_secret_key_123"
```

---

## 4. Local Developer Testing Guide

### Prerequisites
1. Node.js 18+
2. [Stripe CLI](https://docs.stripe.com/stripe-cli) (`brew install stripe/stripe-cli/stripe`)

### Step 1: Install Dependencies
```bash
cd billing-worker
npm install
```

### Step 2: Configure Local Secrets (`.dev.vars`)
Copy `.dev.vars.example` to `.dev.vars`:
```bash
cp .dev.vars.example .dev.vars
```
Fill in your `STRIPE_SECRET_KEY` (from Stripe Dashboard -> Test Mode -> Developers -> API Keys).

### Step 3: Start Local Worker
```bash
npm run dev
```
Worker starts running on `http://localhost:8787`.

### Step 4: Start Webhook Listener
In a second terminal, log in to Stripe CLI and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:8787/webhooks/stripe
```
Copy the webhook signing secret printed by the CLI (`whsec_...`) and paste it as `STRIPE_WEBHOOK_SECRET` inside your `.dev.vars` file.

---

## 5. Production Deployment

### Step 1: Set Production Secrets in Cloudflare
```bash
cd billing-worker
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put API_KEY
npx wrangler secret put DISCORD_WEBHOOK_URL
```

### Step 2: Deploy Worker
```bash
npx wrangler deploy
```

### Step 3: Register Production Webhook in Stripe
1. Go to **Stripe Dashboard -> Developers -> Webhooks -> Add endpoint**.
2. Endpoint URL: `https://billing.sondri.ai/webhooks/stripe`
3. Select events:
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copy the Signing Secret (`whsec_live_...`) and store it via `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.
