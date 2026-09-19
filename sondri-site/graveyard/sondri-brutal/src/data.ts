// All site copy. Plain and direct: short sentences, a number wherever we
// have one, no metaphor. Structure modeled on Ramp / Blue Orange EDGE.

export const CONTACT_EMAIL = 'sales@sondri.ai';
export const mailto = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

/**
 * Scheduling link.
 * - For Cal.com: Set CAL_LINK to your username/event (e.g. 'sondri/discovery').
 *   This opens the embedded dark-mode modal on the site.
 * - For Google Calendar Appointment Schedule or other URLs: Set BOOK_HREF directly to the full URL.
 */
export const CAL_LINK = 'sondri/discovery';
export const BOOK_HREF = `https://cal.com/${CAL_LINK}`;

export const TAGLINE = 'Software & automation, made simple';

/** One offer, one label, everywhere. */
export const CTA_PRIMARY = 'Book a Free Discovery';
export const RISK_REVERSAL = 'Free. No commitment.';

export const navV2 = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'How It Works', href: '/how-it-works/' },
  { label: 'Get in Touch', href: '/get-in-touch/' },
];

export const problemStats = [
  { n: '88%', label: 'of enterprise AI pilots never make it into production.' },
  { n: '$2M+', label: 'typical systems-integrator bill before any value lands.' },
  { n: '9 mo.', label: 'average time-to-value the traditional way.' },
];
/** The framework. 0 → 1 → n is the philosophy; each phase is an engagement.
    No prices on cards — every engagement is quoted individually. */
export const framework = [
  {
    num: '0',
    name: 'Prove',
    does: 'We sit with your operators and find the three workflows where AI pays fastest.',
    gets: 'A board-ready roadmap with hard ROI on each use case.',
  },
  {
    num: '1',
    name: 'Production',
    does: 'Your first solution goes live inside the systems you already run — designed by our architects, built by vetted specialists.',
    gets: 'Working software in a real workflow, measured against an agreed baseline.',
  },
  {
    num: 'n',
    name: 'Multiply',
    does: 'We operate, tune, and improve — and ship new use cases on a steady cadence, on the foundation already built.',
    gets: 'A compounding portfolio of solutions, each faster and cheaper than the last.',
  },
];

/** Hero strip: what we do (replaced the industries strip). */
export const capabilities = [
  'Workflow Automation',
  'Data & Reporting',
  'Customer Operations',
  'Back Office',
  'Integrations',
  'Agentic AI Solutions',
];

export const industries = [
  { name: 'Private Equity', line: 'Portfolio-wide value creation on hold-period timelines.' },
  { name: 'Financial Services', line: 'Risk and decisioning, with the audit trail regulators expect.' },
  { name: 'Fintech & Payments', line: 'Fraud, underwriting, and automation in the transaction path.' },
  { name: 'Healthtech', line: 'Claims, RCM, and clinical data. HIPAA-aware delivery.' },
  { name: 'CPG & Retail', line: 'Demand forecasting and pricing on one trusted data foundation.' },
  { name: 'Real Estate', line: 'Valuation, underwriting, and market intelligence.' },
];

export const timeline = [
  { wk: '01', title: 'Discover', body: 'We sit with your operators, map the workflows, and scope three use cases with measurable ROI.' },
  { wk: '02', title: 'Build', body: 'Our architects design. Vetted specialists deliver against the blueprint, reviewed at every gate.' },
  { wk: '03', title: 'Deploy', body: 'The software goes live in your environment, inside your controls. Your team takes the wheel.' },
  { wk: '04', title: 'Scale', body: 'New use cases ship on a steady cadence. We stay on to operate, tune, and support.' },
];

export const teamModel = [
  { tag: 'ARCHITECTS', title: 'Sondri core team', body: 'Senior solution architects run discovery, design the system, and hold the quality gate. Nothing ships that hasn’t earned it.' },
  { tag: 'BUILDERS', title: 'Specialist network', body: 'Vetted global specialists build against the blueprint at a fraction of typical consulting rates. Every deliverable is reviewed by the core team.' },
  { tag: 'YOURS', title: 'Your operators', body: 'Your team is in the room from week one and at the controls from day one of production. We train, then we support.' },
];

export const faq = [
  {
    q: 'Does our data leave our systems?',
    a: 'No. Everything we build deploys into your environment, inside your controls — with audit trails, approvals, and guardrails your auditors will recognize.',
  },
  {
    q: 'What do you build on?',
    a: 'The stack you already run. ERP, CRM, spreadsheets, payments — we integrate with the systems and data you have. There is no Sondri platform to adopt and no license to shelve.',
  },
  {
    q: 'Who owns what you build?',
    a: 'You do. The software, integrations, and documentation are yours, running in your environment.',
  },
  {
    q: 'What does it cost?',
    a: 'Every engagement is quoted individually — a fixed price agreed before each phase starts, and you commit one rung at a time. No one-size-fits-all packages.',
  },
  {
    q: 'What if the first build misses its baseline?',
    a: 'The baseline is agreed before we start, and the work is measured against it. If it doesn’t clear the bar, you keep the roadmap and the measurement — and you owe nothing further.',
  },
  {
    q: 'How fast can we start?',
    a: 'The first discovery session is free and digital-first. From kickoff, the roadmap comes together in days and working software follows in weeks — not quarters.',
  },
];

/** Home: what working with us feels like — simplicity shown, not claimed. */
export const feelSteps = [
  { i: '01', t: 'Tell us what’s slow', b: 'A thirty-minute conversation about the work that eats your team’s time. No prep, no jargon, no deck.' },
  { i: '02', t: 'We build it into your systems', b: 'You keep running the business. Our team builds the solution on the tech and data you already have.' },
  { i: '03', t: 'You see the results', b: 'A workflow that used to be slow, running fast — and a number on the P&L that moved.' },
];

/** Industries page: one section per vertical, in operator language. */
export const industriesDetail = [
  {
    id: 'private-equity',
    name: 'Private Equity',
    tagline: 'Value creation you can repeat across the book.',
    intro: 'Hold periods are short and the board wants an AI answer that survives diligence. We give portfolio companies working solutions — not another vendor evaluation.',
    problems: ['Diligence and reporting eat operating partners’ time', 'Every portfolio company reinvents the same automation', 'AI roadmaps that never tie to EBITDA'],
    builds: ['Diligence and monitoring support wired into your reporting stack', 'EBITDA-linked roadmaps scoped per company', 'Playbooks that repeat across 3 to 15 companies per program'],
    stat: '3–15 companies per program',
  },
  {
    id: 'financial-services',
    name: 'Financial Services',
    tagline: 'Risk and decisioning, with the audit trail regulators expect.',
    intro: 'Banks and asset managers don’t need experimental AI. They need governed decisioning that a regulator can walk through line by line.',
    problems: ['Manual review queues that scale with headcount', 'Fraud and risk models nobody can explain to an examiner', 'Data locked across systems of record'],
    builds: ['Governed decisioning with approvals and full audit trails', 'Fraud detection tuned to your book, monitored in production', 'Real-time data flows across the systems you already run'],
    stat: 'Real-time decisioning',
  },
  {
    id: 'fintech-payments',
    name: 'Fintech & Payments',
    tagline: 'Production AI in the transaction path.',
    intro: 'When the workflow touches money movement, "pilot" isn’t good enough. We deploy into the transaction path with monitoring and guardrails from day one.',
    problems: ['Fraud losses growing faster than the review team', 'Underwriting backlogs that cost you good customers', 'Automation ideas stuck behind the core engineering queue'],
    builds: ['Fraud and risk scoring live in the transaction path', 'Underwriting automation with human approval gates', 'Back-office automation that doesn’t wait on your roadmap'],
    stat: 'Fraud + underwriting in production',
  },
  {
    id: 'healthtech',
    name: 'Healthtech',
    tagline: 'Claims, RCM, and clinical data — handled with care.',
    intro: 'Health data is fragmented and the compliance bar is real. We deliver HIPAA-aware solutions that clinicians and operators actually trust.',
    problems: ['Claims and denials workflows drowning in manual touches', 'Revenue cycle leakage nobody can trace', 'Clinical and operational data that never meet'],
    builds: ['Claims and denials automation with human oversight', 'RCM intelligence that finds and fixes the leakage', 'Unified, governed views across clinical and operational data'],
    stat: 'HIPAA-aware delivery',
  },
  {
    id: 'cpg-retail',
    name: 'CPG & Retail',
    tagline: 'Demand, pricing, and supply chain on one trusted foundation.',
    intro: 'Margins live and die on forecasts and pricing calls. We put decision-grade intelligence on the data you already collect.',
    problems: ['Forecasts built in spreadsheets, argued in meetings', 'Pricing decisions lagging the market by weeks', 'Supply chain surprises that were visible in the data'],
    builds: ['Demand forecasting your planners actually use', 'Pricing intelligence with clear recommendations, not dashboards', 'Supply chain signals surfaced before they become fires'],
    stat: 'Forecast + pricing intelligence',
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    tagline: 'Valuation and market intelligence, decision-ready.',
    intro: 'The data exists — it’s just scattered across markets, brokers, and PDFs. We unify it into underwriting your investment committee can act on.',
    problems: ['Underwriting that takes days per deal', 'Market data trapped in PDFs and broker emails', 'Valuations that age out before the meeting'],
    builds: ['Automated valuation and underwriting support', 'Market intelligence unified across 60+ markets', 'Deal pipelines that keep themselves current'],
    stat: '60+ markets covered',
  },
];

/** Why Sondri: the simplicity philosophy + why now + operating principles. */
export const whyNow = [
  { t: 'The technology finally works', b: 'Frontier AI can now run end-to-end workflows, not just answer questions. Deployment is weeks, not quarters.' },
  { t: 'The talent model changed', b: 'Vetted global specialists deliver at 20–30% of US consulting rates — behind our quality gates, reviewed by our architects.' },
  { t: 'Your board is asking', b: 'Every quarter the AI question gets sharper. “We’re evaluating” stopped working a year ago.' },
];

export const bedrock = [
  { t: 'Mapped to the P&L', b: 'Every engagement starts from a line item — a cost to cut or revenue to unlock. Never a demo.' },
  { t: 'Compounding by design', b: 'Each solution makes the next one faster, cheaper, and easier to trust.' },
  { t: 'Frontier, translated', b: 'We track the AI frontier so you don’t have to — and bring back only the parts that pay.' },
];

/** Get-in-touch: what happens after you reach out. */
export const contactSteps = [
  { i: '01', t: 'Intro call', b: 'Thirty minutes with a founder. You describe the operation; we tell you honestly whether there’s a case.' },
  { i: '02', t: 'Free discovery session', b: 'We map your highest-payback workflows. No commitment, no fee.' },
  { i: '03', t: 'Roadmap and proposal', b: 'Three use cases with hard ROI, and a fixed price to put the first one in production.' },
];
