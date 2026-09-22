# Payments & Deposits — `/pay/`

**Source:** `src/pages/pay.astro` — all copy is inline on this page (nothing from `data.ts`).

## Page meta

- **Title:** Payments & Deposits — Sondri
- **Description:** Submit an agreed invoice deposit or custom payment for Sondri AI automation services.

---

## Section 1 — Hero

- **Kicker:** SONDRI PAYMENTS
- **H1:** Secure Client Payment & Deposit Portal
- **Lede:** Submit an agreed project deposit, retainer payment, or invoice. All transactions are processed through 256-bit encrypted Stripe Checkout with instant receipt generation.

---

## Section 2 — Payment form card

- **Plan code (small label):** CLIENT PAYMENT PORTAL
- **H2:** PAY AN INVOICE OR DEPOSIT
- **Body:** Enter your billing email, the custom amount agreed with the Sondri engineering team, and your project reference.

### Form fields

| Label | Placeholder |
|---|---|
| BILLING EMAIL ADDRESS * | billing@company.com |
| PAYMENT AMOUNT ($ USD) * | 2500.00 |
| INVOICE REFERENCE / PROJECT DESCRIPTION * | Deposit for AI Workflow Sprint |

- **Submit button:** PROCEED TO SECURE CHECKOUT →
- **Button while submitting:** GENERATING CHECKOUT...

### Error messages

- **Checkout failure:** `Checkout Error: {message}` — fallback message: *Unable to generate checkout session*
- **Network failure:** `Connection Error: {message}` — fallback message: *Unable to reach payment gateway*

---

## Section 3 — Security footer

- 256-BIT ENCRYPTED • AUTOMATIC PDF TAX RECEIPTS • POWERED BY STRIPE
