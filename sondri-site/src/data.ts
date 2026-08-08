// All site copy. Plain and direct: short sentences, a number wherever we
// have one, no metaphor. Structure modeled on Ramp / Blue Orange EDGE.

export const CONTACT_EMAIL = 'founder@sondri.ai';
export const mailto = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
export const BOOK_HREF = mailto('Discovery call — Sondri');

export const nav = [
  { label: 'HOME', href: '/' },
  { label: 'HOW IT WORKS', href: '/how-it-works/' },
  { label: 'GET IN TOUCH', href: '/get-in-touch/' },
];

export const footerNav = [
  ...nav,
  { label: 'PAY AN INVOICE', href: '/pay/' },
];

export const problemStats = [
  { n: '88%', label: 'of enterprise AI pilots never make it into production.' },
  { n: '$2M+', label: 'typical systems-integrator bill before any value lands.' },
  { n: '9 mo.', label: 'average time-to-value the traditional way.' },
];

/** The framework. 0 → 1 → n is the philosophy; each phase is an engagement. */
export const framework = [
  {
    num: '0',
    name: 'Prove',
    when: 'WEEKS 1–2',
    price: 'FREE SESSION → $25K SPRINT',
    does: 'We embed with your operators and map the workflows that move money.',
    gets: 'A board-ready roadmap. Three use cases, hard ROI on each.',
  },
  {
    num: '1',
    name: 'Production',
    when: 'WEEKS 3–8',
    price: '$80–250K',
    does: 'Our architects design the agents. Vetted specialists build them into the systems you already run.',
    gets: 'Your first agent live in a real workflow, measured against an agreed baseline.',
  },
  {
    num: 'n',
    name: 'Multiply',
    when: 'MONTH 3+',
    price: '$8–25K/MO',
    does: 'We operate, tune, and govern — and ship a new use case every month on the foundation already built.',
    gets: 'A compounding portfolio of agents, each faster and cheaper than the last.',
  },
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
  { wk: 'WEEKS 1–2', title: 'Discover', body: 'We sit with your operators, map the workflows, and scope three use cases with measurable ROI.' },
  { wk: 'WEEKS 3–6', title: 'Build', body: 'Our architects design. Vetted specialists deliver against the blueprint, reviewed at every gate.' },
  { wk: 'WEEKS 7–8', title: 'Deploy', body: 'Agents go live in your environment, inside your governance. Your team takes the controls.' },
  { wk: 'MONTH 3+', title: 'Scale', body: 'A new use case ships monthly. We stay on for tuning and governance.' },
];

export const teamModel = [
  { tag: 'ARCHITECTS', title: 'Sondri core team', body: 'Senior solution architects run discovery, design the system, and hold the quality gate. Nothing ships that hasn’t earned it.' },
  { tag: 'BUILDERS', title: 'Specialist network', body: 'Vetted global specialists build against the blueprint at 20–30% of US consulting rates. Every deliverable is reviewed by the core team.' },
  { tag: 'YOURS', title: 'Your operators', body: 'Your team is in the room from week one and at the controls from day one of production. We train, then we support.' },
];

export const faq = [
  {
    q: 'Does our data leave our systems?',
    a: 'No. Agents deploy into your environment, inside your governance — with audit trails, approvals, and guardrails your regulators will recognize.',
  },
  {
    q: 'What do you deploy on?',
    a: 'The stack you already run. ERP, CRM, claims, payments — we integrate with your systems of record. There is no Sondri platform to adopt and no license to shelve.',
  },
  {
    q: 'Who owns what you build?',
    a: 'You do. The agents, integrations, and documentation are yours, running in your environment.',
  },
  {
    q: 'What if the pilot misses its baseline?',
    a: 'The baseline is agreed before we start, and the pilot is measured against it. If it doesn’t clear the bar, you keep the roadmap and the measurement — and you owe nothing further.',
  },
  {
    q: 'How fast can we start?',
    a: 'The first discovery session is free and digital-first. From kickoff, you have a board-ready roadmap in two weeks and an agent in production in eight.',
  },
];

/** Get-in-touch: what happens after you reach out. */
export const contactSteps = [
  { i: '01', t: 'Intro call', b: 'Thirty minutes with a founder. You describe the operation; we tell you honestly whether there’s a case.' },
  { i: '02', t: 'Free discovery session', b: 'We map your highest-payback workflows. No commitment, no fee.' },
  { i: '03', t: 'Roadmap and proposal', b: 'Three use cases with hard ROI, and a fixed price to put the first one in production.' },
];
