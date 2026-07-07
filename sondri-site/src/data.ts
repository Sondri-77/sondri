// All site copy. Enterprise-first positioning (PE, financial services, fintech,
// healthtech, CPG & retail, real estate) — see docs/superpowers/specs/
// 2026-07-06-cinematic-redesign-design.md.

export const CONTACT_EMAIL = 'founder@sondri.ai';
export const mailto = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
export const BOOK_HREF = mailto('Discovery sprint — Sondri');

export const nav = [
  { label: 'HOME', href: '/' },
  { label: 'HOW IT WORKS', href: '/how-it-works/' },
  { label: 'INDUSTRIES', href: '/industries/' },
  { label: 'FOR CUSTOMERS', href: '/for-customers/' },
  { label: 'ABOUT', href: '/about/' },
];

export const footerNav = [
  ...nav,
  { label: 'DESIGN SYSTEM', href: '/design-system/' },
];

export const marquee = [
  'PRIVATE EQUITY', '◆', 'FINANCIAL SERVICES', '◆', 'FINTECH & PAYMENTS', '◆',
  'HEALTHTECH', '◆', 'CPG & RETAIL', '◆', 'REAL ESTATE', '◆',
  'PRIVATE EQUITY', '◆', 'FINANCIAL SERVICES', '◆', 'FINTECH & PAYMENTS', '◆',
  'HEALTHTECH', '◆', 'CPG & RETAIL', '◆', 'REAL ESTATE', '◆',
];

export const neonPhrases = [
  'A shared second brain for your operating teams',
  'Agents wired into your systems of record',
  'Prototype to production in eight weeks',
  'Unit economics engineered before anything scales',
  'Governed from day zero. Productive on day one.',
];

/** Scroll-scrubbed hero beats. from/to are pin-progress windows (0–1). */
export const orbitBeats = [
  { from: 0.0,  to: 0.13, side: 'left',   k: 'SONDRI — THE WORKING MODEL', t: 'Meet the working model.', b: 'One machine-precision system of agents, engineered into the core of your enterprise.' },
  { from: 0.17, to: 0.28, side: 'right',  k: 'PRODUCTION GRADE',           t: 'Engineered. Not demoed.', b: 'Every agent ships production-first — monitored, governed, accountable to a baseline.' },
  { from: 0.32, to: 0.43, side: 'left',   k: 'INTEGRATION',                t: 'Wired into your systems of record.', b: 'ERP, CRM, claims, payments — agents that act where your data already lives.' },
  { from: 0.46, to: 0.55, side: 'center', k: 'GOVERNANCE',                 t: 'Governed from day zero.', b: 'Audit trails, approvals, and guardrails your regulators will recognize.' },
  // — macro fly-through: the forge story —
  { from: 0.58, to: 0.68, side: 'left',   k: 'FORGED',   t: 'Titanium discipline.', b: 'Workflows machined to tolerance. Nothing ships until it survives our quality gates.' },
  { from: 0.72, to: 0.83, side: 'right',  k: 'SAPPHIRE', t: 'Clarity under pressure.', b: 'Decisions your board can look straight through — every metric visible, every outcome measured.' },
  { from: 0.86, to: 0.97, side: 'left',   k: 'ENGRAVED', t: 'Accountability, etched in.', b: 'Sondri indices on every deployment: owner, baseline, payback, renewal.' },
] as const;

export const problemStats = [
  { n: '88%', label: 'of enterprise AI pilots never make it into production.' },
  { n: '$2M+', label: 'typical systems-integrator engagement before any value lands.' },
  { n: '9 mo.', label: 'average time-to-value for a traditional AI implementation.' },
];

export const doSteps = [
  { i: '01', t: 'We embed with your operators and map the workflows that move money.' },
  { i: '02', t: 'We design and build the agents, integrations, and guardrails.' },
  { i: '03', t: 'We deploy onto the stack you already run — no platform lock-in.' },
  { i: '04', t: 'We train your teams and stay on for governance, tuning, and scale.' },
];

export const phases = [
  { num: '0', dur: '2 WEEKS', title: 'Discover', body: 'Workflow audit with your operators. We scope three use cases with board-ready ROI.' },
  { num: '1', dur: '6 WEEKS', title: 'Build', body: 'First agents reach production. Our architects blueprint; vetted specialists deliver.' },
  { num: 'n', dur: 'ONGOING', title: 'Scale', body: 'New use cases land monthly. We stay on for tuning, governance, and the next wave.' },
];

export const ladder = [
  { n: '01', tag: 'FREE · DIGITAL', title: 'Design Thinking & Discovery', body: 'A free, digital-first session that frames the problem and maps the highest-payback use cases.', h: 168, top: false },
  { n: '02', tag: 'PROOF', title: 'Pilot & Measure', body: 'A scoped agent ships into one live workflow and is measured against a hard, agreed baseline.', h: 232, top: false },
  { n: '03', tag: 'PRODUCTION', title: 'Deploy & Scale', body: 'One proven use case becomes many — in production, on the stack you already run.', h: 296, top: false },
  { n: '04', tag: 'RETAINED', title: 'Operate & Govern', body: 'Continuous tuning, monitoring, and governance keep every agent earning its keep.', h: 360, top: false },
  { n: '05', tag: 'PARTNER', title: 'Standing Advisor', body: 'A permanent seat at the table for every AI decision your business faces next.', h: 424, top: true },
];

export const bedrock = [
  { t: 'Mapped to the P&L', b: 'Every engagement starts from a line item — a cost to cut or revenue to unlock. Never a demo.' },
  { t: 'Compounding by design', b: 'Each deployment makes the next one faster, cheaper, and easier to trust.' },
  { t: 'Frontier, translated', b: 'We track the AI frontier so your board doesn’t have to — and bring back only the parts that pay.' },
];

export const timeline = [
  { wk: 'WEEKS 1–2', title: 'Discovery', body: 'We sit with your operators and map every workflow. Then we scope three use cases with hard, measurable ROI.' },
  { wk: 'WEEKS 3–6', title: 'Build', body: 'Our architects design the agents. Vetted specialists deliver against the blueprint, reviewed at every gate.' },
  { wk: 'WEEKS 7–8', title: 'Deploy & Train', body: 'Agents go live in your environment, inside your governance. Your people learn to operate, refine, and request more.' },
  { wk: 'MONTH 3+', title: 'Scale', body: 'New use cases land monthly. Sondri stays on for tuning, governance, and the next wave.' },
];

export const engine = [
  { tag: '0 → 1', title: 'Sondri Core Team', items: ['Senior solution architects', 'Executive discovery', 'Architecture & blueprint', 'Quality gate before scale'] },
  { tag: '1 → n', title: 'Specialist Network', items: ['Vetted global specialists', 'Build agents & integrations', '20–30% of US consulting rates', 'Reviewed by core team'] },
  { tag: 'OUTCOMES', title: 'Your Business', items: ['Private equity · banking', 'Fintech · healthtech', 'CPG · real estate', 'Renewals + expansion'] },
];

export const whyNow = [
  { i: '01', t: 'Capable agents', b: 'Frontier models can now run end-to-end workflows — not just answer questions. Deployment is weeks, not quarters.' },
  { i: '02', t: 'Global talent', b: 'A new generation of vetted specialists can deliver at 20–30% of US consulting rates, behind our quality gates.' },
  { i: '03', t: 'Boards are asking', b: 'Every earnings call has an AI question. Operators need an answer that survives diligence. Sondri is that answer.' },
];

export const pains = [
  { t: 'Your pilots die in the lab', b: 'Eighteen months of proofs-of-concept and nothing in production. The deck was great; the P&L never moved.' },
  { t: 'Your data team is a bottleneck', b: 'Every AI idea queues behind the same ten engineers. The backlog is where momentum goes to die.' },
  { t: 'The board wants an answer', b: 'Every quarter the AI question gets sharper. “We’re evaluating” stopped working a year ago.' },
  { t: 'You don’t want another platform', b: 'You want outcomes — agents that fit the systems you already run, not another license to shelve.' },
];

export const pricing = [
  { name: 'Discovery Sprint', price: '$25K', unit: 'fixed fee', body: 'A two-week diagnostic. We map your workflows and scope three use cases with board-ready ROI. Converts to build.', hot: false },
  { name: 'Build Engagement', price: '$80–250K', unit: 'per use case', body: 'Scoped at discovery, delivered against our blueprint by vetted specialists, reviewed at every gate.', hot: true },
  { name: 'Care & Scale', price: '$8–25K', unit: 'per month', body: 'Monthly recurring — tuning, governance, and a steady cadence of new use cases.', hot: false },
];

export const econ = [
  { n: '$180K', label: 'AVG CONTRACT VALUE' },
  { n: '62%', label: 'GROSS MARGIN' },
  { n: '5 mo.', label: 'PAYBACK PERIOD' },
  { n: '135%', label: 'NET REVENUE RETENTION' },
];

export const verticals = ['PE portfolio company', 'Regional banking group', 'Payments platform', 'Healthcare operator', 'National retail chain'];

export const industries = [
  { name: 'Private Equity', tagline: 'PORTFOLIO-WIDE VALUE CREATION', body: 'Diligence support, EBITDA-linked AI roadmaps, and repeatable playbooks deployed across the book on hold-period timelines.', stat: '3 to 15 cos / program' },
  { name: 'Financial Services', tagline: 'RISK AND DECISIONING AT SCALE', body: 'Governed ML, fraud detection, and real-time data for banks and asset managers, with the audit trail regulators expect.', stat: 'Real-time decisioning' },
  { name: 'Fintech & Payments', tagline: 'PRODUCTION AI FOR MONEY MOVEMENT', body: 'Fraud, underwriting, and intelligent automation deployed into the transaction path with monitoring and guardrails.', stat: 'Fraud + underwriting' },
  { name: 'Healthtech', tagline: 'CLAIMS, RCM, AND CLINICAL DATA', body: 'Fragmented health data, unified and governed. Models that clinicians and operators trust, with privacy built in.', stat: 'HIPAA-aware delivery' },
  { name: 'CPG & Retail', tagline: 'DEMAND, PRICING, AND SUPPLY CHAIN', body: 'Forecasting, pricing intelligence, and supply chain optimization built on a single, trusted data foundation.', stat: 'Forecast + pricing' },
  { name: 'Real Estate', tagline: 'VALUATION AND MARKET INTELLIGENCE', body: 'Automated valuation, underwriting, and market data unified into one decision-ready platform across markets.', stat: '60+ markets' },
];

export const reports = [
  'Fintech & Payments', 'Healthcare IT & RCM', 'CPG, Food & Beverage', 'E-commerce & DTC',
  'Investment Management', 'Pharma Services & CRO', 'Retail Tech & POS', 'Data Infrastructure & MLOps',
];

export const perks = [
  { t: 'Meaningful equity', b: 'Top 1% of the cap table. We’re hiring the people who shape the company, not fill seats.' },
  { t: 'Real customers from day one', b: 'No phantom roadmaps. You’ll ship into live, revenue-generating accounts in week one.' },
  { t: 'A market that’s wide open', b: 'Enterprise AI delivery is an underexploited frontier. The first credible brand here wins big.' },
  { t: 'Leverage, not headcount', b: 'A small core team with a global specialist network. You’ll punch ten times your weight.' },
];

export const swatches = [
  { hex: '#0C1A1A', name: 'INK', use: 'Base canvas' },
  { hex: '#081313', name: 'INK DEEP', use: 'Recessed panels' },
  { hex: '#ffcc78', name: 'GOLD', use: 'Primary accent' },
  { hex: '#F7C062', name: 'TAN', use: 'Artifact surfaces' },
  { hex: '#16324F', name: 'SAPPHIRE', use: 'Visor glass' },
  { hex: '#E6F2F0', name: 'BONE', use: 'Display type' },
  { hex: '#86A19E', name: 'CLAY', use: 'Body copy' },
];

export const typeScale = [
  { s: 'DISPLAY', f: "'Space Grotesk', sans-serif", size: '116px', ex: 'Aa' },
  { s: 'HEADING', f: "'Space Grotesk', sans-serif", size: '58px', ex: 'Working model' },
  { s: 'LABEL / UI', f: "'Space Mono', monospace", size: '11px', ex: 'AI WORKING MODELS' },
  { s: 'BODY', f: "'Space Mono', monospace", size: '14px', ex: 'Done-for-you, end to end.' },
];
