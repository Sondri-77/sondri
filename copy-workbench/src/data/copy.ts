export const CONTACT_EMAIL = 'sales@sondri.ai';

export const mailto = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

export const TAGLINE = 'Software & automation for your business';

export const CTA_PRIMARY = 'Book a Free Discovery';

export const RISK_REVERSAL = 'Free, with no commitment.';

export const navV2 = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'How It Works', href: '/how-it-works/' },
  { label: 'Get in Touch', href: '/get-in-touch/' },
];

export const problemStats = [
  { n: '88%', label: 'of enterprise AI pilots never make it into production.' },
  { n: '$2M+', label: 'typical systems-integrator bill before launch.' },
  { n: '9 mo.', label: 'average time to launch with a traditional provider.' },
];

export const framework = [
  {
    num: '0',
    name: 'Prove',
    does: 'We work with your team to choose three workflows to improve.',
    gets: 'A roadmap with estimated costs and savings for each workflow.',
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
    does: 'We maintain the software and reuse what we built for the next workflow.',
    gets: 'Software for more of your workflows, with less to build from scratch.',
  },
];

export const capabilities = [
  'Workflow Automation',
  'Data & Reporting',
  'Customer Operations',
  'Back Office',
  'Integrations',
  'Agentic AI Solutions',
];

export const timeline = [
  { wk: '01', title: 'Discover', body: 'We map your workflows and estimate the cost and savings of three possible builds.' },
  { wk: '02', title: 'Build', body: 'Our architects design the software and review the work our specialists build.' },
  { wk: '03', title: 'Deploy', body: 'The software goes live in your environment, with your team trained to use it.' },
  { wk: '04', title: 'Scale', body: 'We support the software after launch and build for more workflows.' },
];

export const teamModel = [
  { tag: 'ARCHITECTS', title: 'Sondri core team', body: 'Senior architects lead discovery, design the system, and review the software before launch.' },
  { tag: 'BUILDERS', title: 'Specialist network', body: 'Our specialist network builds the software at lower rates than typical consultancies. The core team reviews their work.' },
  { tag: 'YOURS', title: 'Your operators', body: 'Your team helps plan the build from week one. We train them before launch and support them afterward.' },
];

export const faq = [
  {
    q: 'Does our data leave our systems?',
    a: 'Everything we build runs in your environment, with your access controls, approval steps, and audit logs.',
  },
  {
    q: 'What do you build on?',
    a: 'We connect to your existing ERP, CRM, spreadsheets, and payment systems. You can run what we build without a Sondri platform or license.',
  },
  {
    q: 'Who owns what you build?',
    a: 'You do. The software, integrations, and documentation are yours, running in your environment.',
  },
  {
    q: 'What does it cost?',
    a: 'We quote a fixed price for each phase before it starts. You decide whether to continue after each phase.',
  },
  {
    q: 'What if the first build misses its baseline?',
    a: 'We agree on a baseline before we start and measure the build against it. If it falls short, you keep the roadmap and measurements and owe nothing further.',
  },
  {
    q: 'How fast can we start?',
    a: 'Discovery starts with a free video call. The roadmap takes days, and working software follows in weeks.',
  },
];

export const feelSteps = [
  { i: '01', t: 'Tell us what’s slow', b: 'Thirty minutes to describe the work slowing your team down. You can come without preparing anything.' },
  { i: '02', t: 'We build it into your systems', b: 'You keep running the business. Our team builds the solution on the tech and data you already have.' },
  { i: '03', t: 'Check the time and cost saved', b: 'Compare the time and cost of the workflow before and after the build.' },
];

export const contactSteps = [
  { i: '01', t: 'Intro call', b: 'Spend thirty minutes with a founder describing the process you want to fix. We’ll tell you whether we can help.' },
  { i: '02', t: 'Free discovery session', b: 'We map the workflows costing you the most time or money. The session is free, with no commitment.' },
  { i: '03', t: 'Roadmap and proposal', b: 'Three proposed builds with estimated costs and savings, and a fixed price for the first build.' },
];
