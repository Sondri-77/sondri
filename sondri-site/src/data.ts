// All site copy, ported verbatim from the design prototype
// (design-system/Sondri Site.dc.html → renderVals()).

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
  'RETAIL', '◆', 'CONSTRUCTION', '◆', 'LOGISTICS', '◆', 'TRADES', '◆',
  'RETAIL', '◆', 'CONSTRUCTION', '◆', 'LOGISTICS', '◆', 'TRADES', '◆',
];

export const neonPhrases = [
  'Setting up a shared second brain',
  'AI agents that work with MCPs, skill packs & tools',
  'Prototype to production — better runtime, optimal cost',
  'Highly engineered token economics',
  'Deploying with guaranteed productivity on day zero',
];

export const problemStats = [
  { n: '70%', label: 'of mid-market businesses in non-tech sectors have no AI strategy.' },
  { n: '$250K+', label: 'minimum cost of a bespoke AI consulting engagement today.' },
  { n: '9 mo.', label: 'average time-to-value for a traditional AI implementation.' },
];

export const doSteps = [
  { i: '01', t: 'We diagnose your workflow and pick three high-ROI use cases.' },
  { i: '02', t: 'We design and build the agents, MCPs, tools, and integrations.' },
  { i: '03', t: 'We deploy onto your existing stack — no platform lock-in.' },
  { i: '04', t: 'We train your team and stay on for governance and tuning.' },
];

export const phases = [
  { num: '0', dur: '2 WEEKS', title: 'Discover', body: 'Workflow audit. We map every process and pick three use cases with clear ROI.' },
  { num: '1', dur: '6 WEEKS', title: 'Build', body: 'First agents go live. Our core team blueprints; vetted contractors deliver.' },
  { num: 'n', dur: 'ONGOING', title: 'Scale', body: 'New use cases land monthly. We stay on for tuning, governance, and the next wave.' },
];

export const ladder = [
  { n: '01', tag: 'FREE · DIGITAL', title: 'Design Thinking & Discovery', body: 'A free, digital-first session that frames the problem and maps the highest-payback use cases.', h: 168, top: false },
  { n: '02', tag: 'PROOF', title: 'Pilot & Measure', body: 'A scoped agent ships into one live workflow and is measured against a hard, agreed baseline.', h: 232, top: false },
  { n: '03', tag: 'PRODUCTION', title: 'Deploy & Scale', body: 'One proven use case becomes many — in production, on the stack you already run.', h: 296, top: false },
  { n: '04', tag: 'RETAINED', title: 'Maintenance', body: 'Continuous tuning, monitoring and governance keep every agent earning its keep.', h: 360, top: false },
  { n: '05', tag: 'PARTNER', title: 'Advisor', body: 'A standing seat at the table for whatever AI decision comes next.', h: 424, top: true },
];

export const bedrock = [
  { t: 'Mapping agents to your pain points', b: 'Every rung starts from a real bottleneck in your operation — never a demo.' },
  { t: 'Compounding process improvement', b: 'Each deployment makes the next one faster, cheaper, and easier to trust.' },
  { t: 'Navigating the galaxies unheard of', b: 'We chart the AI frontier that is specific to your business — and bring you along.' },
];

export const timeline = [
  { wk: 'WEEKS 1–2', title: 'Discovery', body: 'We sit with your team and map every workflow. Then we pick three use cases with clear, measurable ROI.' },
  { wk: 'WEEKS 3–6', title: 'Build', body: 'Our core team designs the agents. Vetted contractors deliver against the blueprint, reviewed at every gate.' },
  { wk: 'WEEKS 7–8', title: 'Deploy & Train', body: 'Agents go live in your environment. Your people learn how to operate, refine, and request more.' },
  { wk: 'MONTH 3+', title: 'Scale', body: 'New use cases land monthly. Sondri stays on for tuning, governance, and the next wave.' },
];

export const engine = [
  { tag: '0 → 1', title: 'Sondri Core Team', items: ['Senior solution architects', 'Customer discovery', 'Architecture & blueprint', 'Quality gate before scale'] },
  { tag: '1 → n', title: 'Contractor Network', items: ['Vetted global contractors', 'Build agents & integrations', '20–30% of US consulting rates', 'Reviewed by core team'] },
  { tag: 'OUTCOMES', title: 'Your Business', items: ['Retail · construction', 'Logistics · trades', 'Recurring agent service', 'Renewals + expansion'] },
];

export const whyNow = [
  { i: '01', t: 'Capable agents', b: 'Frontier models can now run end-to-end workflows — not just answer questions. Off-the-shelf tooling makes deployment weeks, not quarters.' },
  { i: '02', t: 'Global talent', b: 'A new generation of skilled contractors in India, Eastern Europe, and Latin America can deliver at 20–30% of US consulting rates.' },
  { i: '03', t: 'Buyer readiness', b: 'Non-tech executives have moved from skepticism to FOMO. Boards are asking the question. Sondri is the answer.' },
];

export const pains = [
  { t: 'You’re drowning in spreadsheets', b: 'Inventory, schedules, quotes, invoices — all in Excel, none of it talking to anything else.' },
  { t: 'You can’t hire a data team', b: 'And the consultants you can afford give you slide decks, not systems that run.' },
  { t: 'Competitors are pulling ahead', b: 'Tech-native rivals are quoting faster, stocking smarter, scheduling tighter.' },
  { t: 'You don’t want a platform', b: 'You want results — agents that fit how you work today, not another login to manage.' },
];

export const pricing = [
  { name: 'Discovery Sprint', price: '$25K', unit: 'fixed fee', body: 'A two-week diagnostic. We map your workflows and scope three use cases. Converts to build.', hot: false },
  { name: 'Build Engagement', price: '$80–250K', unit: 'per use case', body: 'Scoped at discovery, contractor-delivered against our blueprint, reviewed at every gate.', hot: true },
  { name: 'Care & Scale', price: '$8–25K', unit: 'per month', body: 'Monthly recurring — tuning, governance, and a steady cadence of new use cases.', hot: false },
];

export const econ = [
  { n: '$180K', label: 'AVG CONTRACT VALUE' },
  { n: '62%', label: 'GROSS MARGIN' },
  { n: '5 mo.', label: 'PAYBACK PERIOD' },
  { n: '135%', label: 'NET REVENUE RETENTION' },
];

export const verticals = ['Regional retail chain', 'Mid-size contractor', 'Logistics operator', 'Auto service group', 'Specialty trades'];

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
  { t: 'A market that’s wide open', b: 'Non-tech sectors are an underexploited frontier. The first credible brand here wins big.' },
  { t: 'Leverage, not headcount', b: 'A small core team with a global contractor network. You’ll punch ten times your weight.' },
];

export const swatches = [
  { hex: '#0C1A1A', name: 'INK', use: 'Base canvas' },
  { hex: '#081313', name: 'INK DEEP', use: 'Recessed panels' },
  { hex: '#ffcc78', name: 'GOLD', use: 'Primary accent' },
  { hex: '#F7C062', name: 'TAN', use: 'Artifact surfaces' },
  { hex: '#E6F2F0', name: 'BONE', use: 'Display type' },
  { hex: '#86A19E', name: 'CLAY', use: 'Body copy' },
];

export const typeScale = [
  { s: 'DISPLAY', f: "'Space Grotesk', sans-serif", size: '116px', ex: 'Aa' },
  { s: 'HEADING', f: "'Space Grotesk', sans-serif", size: '58px', ex: 'Working model' },
  { s: 'LABEL / UI', f: "'Space Mono', monospace", size: '11px', ex: 'AI WORKING MODELS' },
  { s: 'BODY', f: "'Space Mono', monospace", size: '14px', ex: 'Done-for-you, end to end.' },
];
