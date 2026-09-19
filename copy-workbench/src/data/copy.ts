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
  { n: '88%', label: 'of large-company AI trials never reach everyday use.' },
  { n: '$2M+', label: 'typical bill for connecting business systems before launch.' },
  { n: '9 mo.', label: 'average time to launch with a traditional provider.' },
];

export const framework = [
  {
    num: '0',
    name: 'Prove',
    does: 'You choose three jobs to improve with our team.',
    gets: 'A plan with estimated costs and savings for each job.',
  },
  {
    num: '1',
    name: 'Production',
    does: 'You start using the software in your existing systems after our senior team checks the build.',
    gets: 'Software you can use, with a comparison of time and costs before and after.',
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
  'AI for multi-step jobs',
];

export const timeline = [
  { wk: '01', title: 'Discover', body: 'We map your workflows and estimate the cost and savings of three possible builds.' },
  { wk: '02', title: 'Build', body: 'You work with our senior team on the design, and they check what our specialists build.' },
  { wk: '03', title: 'Deploy', body: 'Your team learns to use the software before it goes live in your systems.' },
  { wk: '04', title: 'Scale', body: 'You can ask us to build for more jobs while we maintain your software.' },
];

export const teamModel = [
  { tag: 'ARCHITECTS', title: 'Sondri core team', body: 'You plan the work with our senior team, who design your software and check it before launch.' },
  { tag: 'BUILDERS', title: 'Specialist network', body: 'Specialists build your software, and our senior team checks their work.' },
  { tag: 'YOURS', title: 'Your team', body: 'Your team helps plan the build from week one. We train them before launch and support them afterward.' },
];

export const faq = [
  {
    q: 'Does our data leave our systems?',
    a: 'Your software runs in your systems, where you control access and approvals and can check records of what happened.',
  },
  {
    q: 'What do you build on?',
    a: 'We connect to the business software, spreadsheets, and payment systems you use. You can run what we build without a Sondri platform or license.',
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
    q: 'What if it doesn’t save what we agreed?',
    a: 'You agree with us on the time or cost savings before we start. If the software falls short, you keep the plan and measurements and owe nothing further.',
  },
  {
    q: 'How fast can we start?',
    a: 'Discovery starts with a free video call. The roadmap takes days, and working software follows in weeks.',
  },
];

export const feelSteps = [
  { i: '01', t: 'Tell us what’s slow', b: 'Spend thirty minutes describing the work slowing you down. You can come without preparing anything.' },
  { i: '02', t: 'We build it into your systems', b: 'You keep running your business while we build with your existing software and data.' },
  { i: '03', t: 'Check the time and cost saved', b: 'Compare the time and cost of the workflow before and after the build.' },
];

export const contactSteps = [
  { i: '01', t: 'Intro call', b: 'Spend thirty minutes with a founder describing the process you want to fix. We’ll tell you whether we can help.' },
  { i: '02', t: 'Free discovery session', b: 'We map the workflows costing you the most time or money. The session is free, with no commitment.' },
  { i: '03', t: 'Roadmap and proposal', b: 'You get three proposed builds with estimated costs and savings, and a fixed price for the first.' },
];
