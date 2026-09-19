/* Home copy — the locked 12 sections (decisions.md D1) in the approved edgy
   voice (decisions.md D2). Every string here is verbatim from
   copy-workbench/src/pages/home-edgy.astro @ 96e3121 — the PRIMARY (1/3)
   heading of each section, the eyebrow, body, lists, [placeholder] marks —
   with two captain addenda: the hero keeps only the one sub-heading, and
   the f-word (every variant) is out everywhere except the unf*ck heading.
   The captain reviews copy in the workbench, not here. Do not edit copy in
   this file; change the workbench and re-copy. */

/** Footer line (in the footer, not the hero). */
export const VALUE_LINE =
  'Sondri works where the money moves—helping businesses improve the workflows, decisions, and systems that create value, with AI where it helps.';

export const knife = [
  { t: 'Money', b: 'An hour a day of workaround is a salary a year, per person doing it. Now count the people who’ve quietly learned to live with it. [placeholder: cost-of-inaction calculator]' },
  { t: 'Time', b: 'It doesn’t get cheaper by waiting. More volume means more hands on the manual thing, and a bigger mess to unwind when you finally do.' },
  { t: 'People', b: 'Your best operators are spending their judgment on data entry. That’s the work people quit over. And when Greg leaves, Greg was the documentation.' },
];

export const benefits = [
  { t: 'A number, not a deck', b: 'Every engagement starts from a line on your P&L, a cost to cut or revenue to unlock, and gets measured against it.' },
  { t: 'Your systems, your code', b: 'Built into the ERP, CRM, and spreadsheets you already run. No Sondri platform, nothing to license, nothing to migrate off later.' },
  { t: 'One rung at a time', b: 'Fixed price per phase, agreed before it starts. Prove it before you fund production. Fund production before you fund scale.' },
];

export const testimonials = [
  { q: '[placeholder] "We’d been talking about fixing invoice matching for two years. Six weeks later it was live and it just… works."', who: '[placeholder] COO, regional logistics company · [placeholder] 14 hrs/week back to the finance team' },
  { q: '[placeholder] "They told us on the first call which of our three ideas was worth doing. That’s why we hired them."', who: '[placeholder] CFO, mid-market manufacturer · [placeholder] first build in production in 7 weeks' },
  { q: '[placeholder] "No platform, no lock-in. Our team owns it and can read every line."', who: '[placeholder] Head of Ops, healthcare services group · [placeholder] $180k annual cost gone' },
];

export const steps = [
  { i: '01', t: 'Tell us what’s slow', b: 'Thirty minutes on the work that eats your team’s week. No prep, no jargon, no deck.' },
  { i: '02', t: 'We build it into your systems', b: 'You keep running the business. We build on the tech and data you already have.' },
  { i: '03', t: 'You watch the number move', b: 'The slow thing, running fast, and a line on the P&L that changed.' },
];

export const comparison = {
  cols: ['Sondri', 'Typical agency / SI', 'Hiring in-house', 'DIY tools'],
  rows: [
    { k: 'Time to something in production', v: ['Weeks [placeholder: 6–8]', 'Quarters [placeholder: 6–9 mo.]', 'Months to hire, then months to build', 'Days, until it touches a real system'] },
    { k: 'Cost shape', v: ['Fixed price per phase, quoted before it starts', 'Time & materials; scope grows with the invoice', 'Salary + benefits + management, project or not', 'Cheap, then your weekends'] },
    { k: 'Who owns the code', v: ['You. Runs in your environment', 'Often the vendor’s platform or license', 'You', 'You, and whoever set it up'] },
    { k: 'Commitment up front', v: ['One rung. Discovery is free', 'Multi-phase SOW before the first thing ships', 'A full-time headcount', 'None, and nobody accountable'] },
    { k: 'After launch', v: ['We run it, tune it, ship the next one', 'Change orders, or a handoff deck', 'Depends on whether that person stays', 'Breaks the day the workflow changes'] },
  ],
};

/** `icon` names a file in public/icons/ (Pixel Icon Library, see NOTICES.md). */
export const features = [
  { t: 'Workflow Automation', icon: 'cog', b: 'The three-person, half-a-day process, done by software, with a human approval gate where it matters.' },
  { t: 'Data & Reporting', icon: 'analytics', b: 'The numbers you argue about in meetings, pulled from the systems of record and kept current without anyone re-keying them.' },
  { t: 'Customer Operations', icon: 'user-headset', b: 'Quoting, onboarding, tickets, renewals. Faster answers without adding headcount.' },
  { t: 'Back Office', icon: 'receipt', b: 'Invoicing, matching, claims, collections, close. The unglamorous work where a typo costs real money.' },
  { t: 'Integrations', icon: 'link', b: 'The systems that don’t talk, made to talk. Yes, that includes the spreadsheet everyone fears but nobody is allowed to kill.' },
  { t: 'Agentic AI Solutions', icon: 'robot', b: 'AI that runs a multi-step job end to end, with monitoring, audit trails, and a person who can pull the plug.' },
];

/** The edgy page carries its own eight FAQs (worded differently from data.ts's). */
export const homeFaq = [
  { q: 'Does our data leave our systems?', a: 'No. Everything we build runs in your environment, inside your controls, with audit trails, approvals, and guardrails your auditors will recognize.' },
  { q: 'What do you build on?', a: 'Whatever you already run. ERP, CRM, spreadsheets, payments. There is no Sondri platform to adopt and no license to shelve.' },
  { q: 'Who owns what you build?', a: 'You do. Code, integrations, docs. Yours, in your environment. We are not holding your business hostage.' },
  { q: 'What does it cost?', a: 'Quoted per engagement, fixed price agreed before each phase, and you commit one rung at a time. No one-size-fits-all packages.' },
  { q: 'What if the first build misses its baseline?', a: 'The baseline is agreed before we start and the work is measured against it. Miss the bar and you keep the roadmap and the measurement, and you owe nothing further.' },
  { q: 'How fast can we start?', a: 'The first discovery call is free. From kickoff, the roadmap comes together in days and working software follows in weeks. Not quarters.' },
  { q: 'Why not just hire an agency, or someone in-house?', a: 'Both work, if you have a quarter and a budget to burn before the first thing ships. An agency sells you a multi-phase engagement up front. A hire takes months to land and only helps if that person stays. We quote one phase at a time, you own everything, and we stick around to run it. If the honest answer for you is “hire someone,” we’ll say so on the first call.' },
  { q: 'Do you use AI for everything?', a: 'No. AI where it makes the fix better, regular software where it doesn’t. We’re not going to wreck your business just to say we used AI.' },
];

/** Section 1 · Hero */
export const hero = {
  h1: 'We fix expensive bullshit. (Using AI where it helps)',
  lede: 'Built into the systems you already run. Live in weeks.',
};

/** Section 2 · Capability scroll */
export const capabilityStrip = { eyebrow: 'Things we do' };

/** Section 3 · Problem */
export const problem = {
  eyebrow: 'Problem',
  h2: 'Your people aren’t inefficient. The shit you make them use is.',
  lede: 'Somewhere in your business, good people are wasting hours on a process everybody agrees is stupid. Nobody has fixed it because the available software doesn’t get it and traditional consulting costs a small fortune. Hi.',
  close: 'The deck got approved. The pilot launched. Eighteen months later the slow thing is still done by hand, because a pilot isn’t a fix.',
};

/** Section 4 · Twist the knife */
export const knifeHead = {
  eyebrow: 'Twist the knife',
  h2: 'That workaround has been “temporary” for four years now.',
  lede: 'The workaround feels cheap because nobody sends an invoice for it. Here’s the bill.',
  close: 'Your team has gotten frighteningly good at working around something that shouldn’t be broken. That doesn’t make it solved. It makes your people unpaid infrastructure.',
};

/** Section 5 · Solution & benefits */
export const solution = {
  eyebrow: 'Solution & benefits',
  h2: 'We unf*ck how work gets done.',
  lede: 'Prove it, ship it, multiply it. Discovery finds the three workflows where the money moves fastest. Production puts the first one live inside your systems. Multiply ships the next ones on what’s already built, each faster and cheaper than the last.',
};

/** Section 6 · Social proof */
export const socialProof = {
  eyebrow: 'Social proof',
  h2: 'From “who the hell built this” to “it just works.”',
  ph: 'All three are placeholders, shape only (role, company type, number). Replace with real customer quotes before this ships.',
};

/** Section 7 · How it works */
export const howItWorks = {
  eyebrow: 'How it works',
  h2: 'Just fix the damn thing.',
  lede: 'Most teams don’t need to understand AI. They need the slow thing to stop being slow. The whole experience:',
};

/** Section 8 · Competitor comparison */
export const comparisonHead = {
  eyebrow: 'Competitor comparison',
  h2: 'A lot of consultants will charge you to rename your problem.',
  lede: 'None of these are wrong. They’re slower, pricier, or riskier than a problem this size deserves. One of them will put it in a deck and recommend another consultant.',
  ph: 'Numbers marked [placeholder] need a source or a real engagement behind them before publishing.',
};

/** Section 9 · Features */
export const featuresHead = {
  eyebrow: 'Features',
  h2: 'Unsexy solutions that work ridiculously well.',
};

/** Section 10 · Why Sondri exists */
export const why = {
  eyebrow: 'Why Sondri exists',
  h2: 'Screw the future of work. Let’s fix the work you have now.',
  quote: '"We started Sondri because we kept watching the same movie: a capable team, a real problem, and eighteen months of AI pilots that never shipped. Here’s the dirty secret: nobody wants AI. They want the expensive, annoying, deeply unsexy problem to go away. That’s what we work on. AI is welcome if it can help."',
  line: 'We could sell you an AI transformation. We’d rather understand the damn thing and build a fix.',
  cta: 'Get in Touch →',
  href: '/get-in-touch/',
};

/** Section 11 · FAQ */
export const faqHead = { eyebrow: 'FAQ', h2: 'Things people ask before they trust us with money.' };

/** Section 12 · Final CTA */
export const finalCta = {
  eyebrow: 'Final CTA',
  h2: 'Stop paying smart people to babysit stupid systems.',
  lede: 'Thirty minutes with a founder. Bring the process that makes reasonable adults consider arson. We’ll tell you straight whether there’s a case, and if the honest answer is “hire someone,” we’ll say that too.',
};
