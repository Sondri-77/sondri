/* Home page copy — verbatim from copy-workbench/src/pages/home-alt.astro
   (the CURRENT-copy alt page, decisions.md D1). Every `[placeholder]` mark is
   kept on purpose: it flags proof or claims we don't have yet. Do not edit
   wording here; change the workbench and re-copy. */

export const hero = {
  h1: 'Simple solutions to not-so-simple problems.',
  lede: 'We fix the problems costing you time and money — built into the systems you already run, live in weeks. AI where it helps. Regular software where it doesn’t.',
  after: 'The roadmap is yours either way.',
};

export const logoStrip = {
  line: 'Trusted by operators who were tired of pilots.',
  ph: '[placeholder] client count / one-line proof',
  logo: '[placeholder] client logo',
  count: 6,
};

export const problem = {
  h2: 'Everyone has an AI initiative. Almost nobody has one in production.',
  body: 'The deck got approved. The pilot launched. Eighteen months later, smart people are still doing the slow thing by hand because nobody built them a better way. The technology was never the issue — the overwhelm was.',
  close: 'Your business doesn’t need more AI. It needs fewer problems.',
};

export const knife = {
  h2: 'Leaving it alone isn’t free.',
  body: 'The workaround feels cheap because nobody sends an invoice for it. Here’s what it’s actually costing.',
  items: [
    { t: 'Money', b: 'A workaround that costs an hour a day is a salary a year — per person doing it. Multiply by the number of people who’ve quietly learned to live with it. [placeholder: cost-of-inaction calculator]' },
    { t: 'Time', b: 'Every quarter the problem stays, growth makes it heavier. More volume means more manual work, not more leverage. The fix doesn’t get cheaper by waiting — it gets harder to unwind.' },
    { t: 'People', b: 'Your best operators are spending their judgment on data entry. That’s the work people leave over. And when they go, the process leaves with them.' },
  ],
  close: 'You’ve been talking about fixing this for two years. That’s the real number.',
};

export const solution = {
  h2: '0 → 1 → n.',
  body: 'Prove it, ship it, multiply it. Discovery finds the three workflows where the money moves fastest. Production puts the first one live inside your systems. Multiply ships the next ones on the foundation already built — each faster and cheaper than the last.',
  benefits: [
    { t: 'A number, not a deck', b: 'Every engagement starts from a line on your P&L — a cost to cut or revenue to unlock — and is measured against it.' },
    { t: 'Your systems, your code', b: 'Built into the ERP, CRM, and spreadsheets you already run. No Sondri platform to adopt, nothing to license, nothing to migrate off later.' },
    { t: 'One rung at a time', b: 'Fixed price per phase, agreed before it starts. Prove it before you fund production. Fund production before you fund scale.' },
  ],
};

export const socialProof = {
  h2: 'What it looks like when the number moves.',
  items: [
    { q: '[placeholder] "We had talked about fixing invoice matching for two years. It was live in six weeks and it just… works."', who: '[placeholder] COO, regional logistics company · [placeholder] 14 hrs/week back to the finance team' },
    { q: '[placeholder] "They told us on the first call which of our three ideas was worth doing. That honesty is why we hired them."', who: '[placeholder] CFO, mid-market manufacturer · [placeholder] first solution in production in 7 weeks' },
    { q: '[placeholder] "No platform, no lock-in. Our team owns it and can read every line."', who: '[placeholder] Head of Ops, healthcare services group · [placeholder] $180k annual cost removed' },
  ],
  ph: 'All three are placeholders — shape only (role, company type, outcome number). Replace with real customer quotes before this ships.',
};

export const howItWorks = {
  h2: 'You never have to become an AI company.',
  body: 'Most teams don’t need to understand AI. They need it to work. The whole experience:',
  steps: [
    { i: '01', t: 'Tell us what’s slow', b: 'Thirty minutes on the work that eats your team’s time. No prep, no jargon, no deck.' },
    { i: '02', t: 'We build it into your systems', b: 'You keep running the business. We build on the tech and data you already have.' },
    { i: '03', t: 'You see the number move', b: 'A workflow that used to be slow, running fast — and a line on the P&L that changed.' },
  ],
};

export const comparison = {
  h2: 'Your other options, honestly.',
  body: 'None of these are wrong. They’re just slower, pricier, or riskier than they need to be for a problem this size.',
  cols: ['Sondri', 'Typical agency / SI', 'Hiring in-house', 'DIY tools'],
  rows: [
    { k: 'Time to something in production', v: ['Weeks [placeholder: 6–8]', 'Quarters [placeholder: 6–9 mo.]', 'Months to hire, then months to build', 'Days — until it touches a real system'] },
    { k: 'Cost shape', v: ['Fixed price per phase, quoted before it starts', 'Time & materials; scope grows with the invoice', 'Salary + benefits + management, whether or not there’s a project', 'Cheap, then your time'] },
    { k: 'Who owns the code', v: ['You. Runs in your environment', 'Often the vendor’s platform or license', 'You', 'You — and whoever set it up'] },
    { k: 'Commitment up front', v: ['One rung. Discovery is free', 'Multi-phase SOW before the first result', 'A full-time headcount', 'None — and no one accountable'] },
    { k: 'After launch', v: ['We operate, tune, and ship the next one', 'Change orders, or a handoff deck', 'Depends on whether that person stays', 'It breaks when the workflow changes'] },
  ],
  ph: 'Numbers marked [placeholder] need a source or a real engagement behind them before publishing.',
};

export const features = {
  h2: 'Six things we build. Bring us the messy one.',
  items: [
    { t: 'Workflow Automation', b: 'The three-person, half-a-day process, done by software with a human approval gate where it matters.' },
    { t: 'Data & Reporting', b: 'The numbers you argue about in meetings, pulled from the systems of record and kept current without anyone re-keying them.' },
    { t: 'Customer Operations', b: 'Quoting, onboarding, tickets, renewals — faster responses without adding headcount.' },
    { t: 'Back Office', b: 'Invoicing, matching, claims, collections, close. The unglamorous work where errors cost real money.' },
    { t: 'Integrations', b: 'The systems that don’t talk, made to talk. Yes, that includes the spreadsheet.' },
    { t: 'Agentic AI Solutions', b: 'AI that runs a multi-step job end to end — with monitoring, audit trails, and a person who can stop it.' },
  ],
};

export const why = {
  quote: '"We started Sondri because we kept watching the same movie: a capable team, a real problem, and eighteen months of AI pilots that never shipped. The technology was never the issue — the overwhelm was. So we built the company we wished existed: it shows up, solves the problem simply, and proves it on a number you already track."',
  body: 'We use AI, but we’re not emotionally attached to it. We’re attached to fixing the problem.',
  link: { label: 'Get in Touch', href: '/get-in-touch/' },
};

export const faqIntro = 'Asked on almost every intro call.';

export const extraFaq = [
  {
    q: 'Why not just hire an agency, or someone in-house?',
    a: 'Both work — if you have a quarter and a budget to burn before the first result. An agency sells you a multi-phase engagement up front; a hire takes months to land and only helps if that person stays. We quote one phase at a time, you own everything we build, and we stay on to run it. If the honest answer for you is “hire someone,” we’ll say so on the first call.',
  },
  {
    q: 'Do you use AI for everything?',
    a: 'No. We use AI where it makes the solution better and regular software where it doesn’t. Nobody is impressed that it uses AI. What matters is whether the problem is gone.',
  },
];

export const finalCta = {
  h2: 'The first conversation is free. The roadmap is yours either way.',
  body: 'Thirty minutes with a founder. You describe the operation; we tell you honestly whether there’s a case.',
};
