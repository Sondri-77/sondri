# Home — `/`

**Source:** `src/pages/index.astro`

## Page meta
> *inline in index.astro*

- **Title:** Sondri — AI working models for the enterprise
- **Description:** Done-for-you AI working models for private equity, financial services, fintech, healthtech, CPG, and real estate. From zero to one. Then one to many.

---

## Section 1 — Cinematic hero (scroll-scrubbed 3D turntable)
> *`data.ts → orbitBeats`* — seven copy "beats" that fade in/out as the user scrolls the pinned hero.

**HUD readout:** AZ 000° *(inline — animates with scroll)*
**Scroll cue:** ↓ SCROLL — THE TURNTABLE TURNS *(inline)*

### Beat 1
- **Kicker:** SONDRI — THE WORKING MODEL
- **Title:** Meet the working model.
- **Body:** One machine-precision system of agents, engineered into the core of your enterprise.

### Beat 2
- **Kicker:** PRODUCTION GRADE
- **Title:** Engineered. Not demoed.
- **Body:** Every agent ships production-first — monitored, governed, accountable to a baseline.

### Beat 3
- **Kicker:** INTEGRATION
- **Title:** Wired into your systems of record.
- **Body:** ERP, CRM, claims, payments — agents that act where your data already lives.

### Beat 4
- **Kicker:** GOVERNANCE
- **Title:** Governed from day zero.
- **Body:** Audit trails, approvals, and guardrails your regulators will recognize.

### Beat 5
- **Kicker:** FORGED
- **Title:** Titanium discipline.
- **Body:** Workflows machined to tolerance. Nothing ships until it survives our quality gates.

### Beat 6
- **Kicker:** SAPPHIRE
- **Title:** Clarity under pressure.
- **Body:** Decisions your board can look straight through — every metric visible, every outcome measured.

### Beat 7
- **Kicker:** ENGRAVED
- **Title:** Accountability, etched in.
- **Body:** Sondri indices on every deployment: owner, baseline, payback, renewal.

---

## Section 2 — Fallback hero (no WebGL / reduced motion)
> *inline in index.astro* — only shown when the 3D hero can't run.

- **Speech bubble tag:** SONDRI.BOT
- **Speech bubble:** Hi, I'm Sondri, your beautifully distinct AI.
- **Kicker:** SONDRI — AI WORKING MODELS
- **Title:** Meet the working model.
- **Lede:** One machine-precision system of agents, engineered into the core of your enterprise.

---

## Section 3 — Hero close (the pitch, after the pin releases)
> *inline in index.astro*

- **Kicker:** SONDRI — AI WORKING MODELS
- **H1:** AI working models, deployed where the money *moves.*
- **Lede:** Done-for-you AI for private equity, financial services, fintech, healthtech, CPG, and real estate. From zero to one. Then one to many.
- **Primary CTA:** START A DISCOVERY SPRINT → *(mailto: Discovery sprint — Sondri)*
- **Secondary CTA:** SEE HOW IT WORKS *(→ /how-it-works/)*

---

## Section 4 — Marquee (scrolling ticker)
> *`data.ts → marquee`* — repeats twice, separated by ◆

PRIVATE EQUITY ◆ FINANCIAL SERVICES ◆ FINTECH & PAYMENTS ◆ HEALTHTECH ◆ CPG & RETAIL ◆ REAL ESTATE ◆

---

## Section 5 — The problem
> *heading inline; stats from `data.ts → problemStats`*

- **Kicker:** 01 / THE PROBLEM
- **H2:** Enterprise AI stalls between the deck and the P&L.
- **Lede:** Boards approve the budget. Pilots launch. Then the integration work, the governance questions, and the talent gap arrive — and the value never ships. Meanwhile the operators who move real money are still waiting for AI that shows up where they work.

| Stat | Label |
|---|---|
| 88% | of enterprise AI pilots never make it into production. |
| $2M+ | typical systems-integrator engagement before any value lands. |
| 9 mo. | average time-to-value for a traditional AI implementation. |

---

## Section 6 — What we do
> *heading inline; steps from `data.ts → doSteps`; neon sign from `data.ts → neonPhrases`*

- **Kicker:** 02 / WHAT WE DO
- **H2:** We build a custom AI *working model* for each customer.
- **Lede:** Done-for-you, end-to-end. No platform to adopt, no license to shelve. Agents engineered into the systems your teams already run.

**Steps**

1. **01** — We embed with your operators and map the workflows that move money.
2. **02** — We design and build the agents, integrations, and guardrails.
3. **03** — We deploy onto the stack you already run — no platform lock-in.
4. **04** — We train your teams and stay on for governance, tuning, and scale.

**Neon sign** — tag: `PROPRIETARY WORKING MODEL`; phrases cycle on each puppet pull:

- A shared second brain for your operating teams
- Agents wired into your systems of record
- Prototype to production in eight weeks
- Unit economics engineered before anything scales
- Governed from day zero. Productive on day one.

---

## Section 7 — 0 → 1 → n (the delivery engine)
> *heading inline; cards from `data.ts → phases`*

- **Kicker:** THE DELIVERY ENGINE
- **H2:** 0 → 1 → *n*

| # | Duration | Title | Body |
|---|---|---|---|
| 0 | 2 WEEKS | Discover | Workflow audit with your operators. We scope three use cases with board-ready ROI. |
| 1 | 6 WEEKS | Build | First agents reach production. Our architects blueprint; vetted specialists deliver. |
| n | ONGOING | Scale | New use cases land monthly. We stay on for tuning, governance, and the next wave. |

---

## Section 8 — The engagement ladder
> *heading inline; rungs from `data.ts → ladder`*

- **Kicker:** THE ENGAGEMENT LADDER
- **H2:** Start free. Climb only as far as the value carries you.
- **Lede:** Five rungs, from a free digital-first discovery to a standing advisory seat. You commit to each rung only once the one below it has paid for itself.

### Rung 01 — tag: FREE · DIGITAL
**Design Thinking & Discovery**
A free, digital-first session that frames the problem and maps the highest-payback use cases.
*Footer label:* RUNG 01

### Rung 02 — tag: PROOF
**Pilot & Measure**
A scoped agent ships into one live workflow and is measured against a hard, agreed baseline.
*Footer label:* RUNG 02

### Rung 03 — tag: PRODUCTION
**Deploy & Scale**
One proven use case becomes many — in production, on the stack you already run.
*Footer label:* RUNG 03

### Rung 04 — tag: RETAINED
**Operate & Govern**
Continuous tuning, monitoring, and governance keep every agent earning its keep.
*Footer label:* RUNG 04

### Rung 05 — tag: PARTNER *(highlighted rung)*
**Standing Advisor**
A permanent seat at the table for every AI decision your business faces next.
*Footer label:* STANDING →

---

## Section 9 — The bedrock
> *`data.ts → bedrock`*

- **Kicker:** THE BEDROCK — TRUE AT EVERY RUNG

| Title | Body |
|---|---|
| Mapped to the P&L | Every engagement starts from a line item — a cost to cut or revenue to unlock. Never a demo. |
| Compounding by design | Each deployment makes the next one faster, cheaper, and easier to trust. |
| Frontier, translated | We track the AI frontier so your board doesn't have to — and bring back only the parts that pay. |

---

## Section 10 — Final CTA
> *inline in index.astro*

- **Kicker:** NEXT STEP
- **H2:** Put a working model inside your portfolio.
- **Lede:** Two weeks to a board-ready roadmap. Eight weeks to agents in production.
- **Primary CTA:** START A DISCOVERY SPRINT → *(mailto: Discovery sprint — Sondri)*
- **Secondary CTA:** TALK TO A FOUNDER *(mailto: Talk to a founder — Sondri)*
