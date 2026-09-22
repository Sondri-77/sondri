/* Home copy — the locked sections (decisions.md D1) in the reviewed edgy
   voice (decisions.md D4). Every string here is verbatim from
   copy-workbench/src/pages/home-edgy.astro @ aef397a (after banned-copy
   rounds 1+2 and the captain's tweaks) — the PRIMARY (1/3) heading of each
   section, the eyebrow, body, lists, [placeholder] marks — with one captain
   addendum: the hero keeps only the one sub-heading (button labels and
   micro-copy come from data.ts). The stat labels and capability strip that
   the workbench takes from its shared copy.ts live here too, so the home
   page reads as one reviewed unit.
   The captain reviews copy in the workbench, not here. Do not edit copy in
   this file; change the workbench and re-copy. Exception: the captain's
   2026-09-21 site-fix brief (eyebrows, asterisked swears, "overhaul", "Kill
   your workarounds", card labels, the cost calculator) was applied here
   directly and still needs carrying back to the workbench. */

/** Footer line (in the footer, not the hero). */
export const VALUE_LINE =
  'We fix the work costing your team time and money, using AI where it helps.';

/** `k` is the card's eyebrow (captain: labels, not numbers, on every card row
    except the How-it-works steps). */
export const problemStats = [
  { k: 'Adoption', n: '88%', label: 'of large-company AI trials never reach everyday use.' },
  { k: 'Cost', n: '$2M+', label: 'typical bill for connecting business systems before launch.' },
  { k: 'Time', n: '9 mo.', label: 'average time to launch with a traditional provider.' },
];

export const capabilities = [
  'Workflow Automation',
  'Data & Reporting',
  'Customer Operations',
  'Back Office',
  'Integrations',
  'AI for multi-step jobs',
];

/** The Impact section's cost-of-inaction calculator, cost = wage × hours ×
    people × 52, read as one sentence (playground C3): each value is a bold
    gold word that opens its slider. `k` is the slider tray's label, `t` the
    input's accessible name, `unit` the suffix on its value. */
export const calculator = {
  inputs: [
    { id: 'wage', k: 'Hourly wage', t: 'Hourly wage', unit: '/h', min: 15, max: 150, step: 1, value: 35, money: true },
    { id: 'hours', k: 'Hours a week', t: 'Hours per week, per person', unit: ' h', min: 1, max: 40, step: 1, value: 5, money: false },
    { id: 'people', k: 'People', t: 'People doing the workaround', unit: '', min: 1, max: 50, step: 1, value: 4, money: false },
  ],
  year: 'per year',
  hint: 'Click a number to change it. Arrow keys work too.',
};

/** `k` is the card's eyebrow; `icon` names a file in public/icons/ (Pixel Icon Library, see NOTICES.md). */
export const benefits = [
  { k: 'Outcome', icon: 'coins', t: 'Cost and savings', b: 'Pick a cost to cut or a way to increase revenue. We measure the change.' },
  { k: 'Ownership', icon: 'code', t: 'Your systems, your code', b: 'Built into the software and spreadsheets you already use. You own the code.' },
  { k: 'Commitment', icon: 'numbered-list', t: 'One phase at a time', b: 'Agree on a fixed price for each phase, then review the work before funding the next.' },
];

/** Endorsements (captain, 2026-09-21: was "Customers"): three fictitious
    advisors / friends of the business on the Sondri method and why AI matters
    now. Shape only — every one is a [placeholder] until a real person signs it. */
export const testimonials = [
  { q: '[placeholder] "They had a working version in front of my ops manager in the second week. Every other firm we spoke to wanted a strategy phase first."', who: '[placeholder] Dana Whitlock · Owner, regional HVAC contractor' },
  { q: '[placeholder] "Most small companies will get AI through the software they already own. Sondri builds it that way, and I haven’t seen another shop do it."', who: '[placeholder] Marcus Oyelaran · Advisor, former CIO of a food distributor' },
  { q: '[placeholder] "Doing this work by hand costs more every year and doing it with AI costs less. Waiting is now the expensive choice, and they tell you that plainly."', who: '[placeholder] Priya Natarajan · Partner, small-business accounting firm' },
];

/* Superseded 2026-09-21: How it works now renders data.ts's `framework` (0 / 1 / n). Kept for the workbench round-trip. */
export const steps = [
  { i: '01', t: 'Tell us what’s slow', b: 'Spend thirty minutes describing the work slowing you down. You can come without preparing anything.' },
  { i: '02', t: 'We build it into your systems', b: 'You keep running your business while we build with your existing software and data.' },
  { i: '03', t: 'Check what changed', b: 'Compare the hours and money spent on the job before and after the build.' },
];

export const comparison = {
  cols: ['Sondri', 'Software agency', 'Hiring in-house', 'DIY tools'],
  rows: [
    { k: 'Time until you can use it', v: ['Weeks [placeholder: 6–8]', 'Quarters [placeholder: 6–9 mo.]', 'Months to hire, then months to build', 'Days to try; integration takes longer'] },
    { k: 'What you pay', v: ['Fixed price per phase, quoted before it starts', 'You pay for hours and expenses', 'Salary + benefits + management, project or not', 'Low fees; you do the work'] },
    { k: 'Who owns the code', v: ['You; runs in your systems', 'Often the vendor’s platform or license', 'You', 'Check ownership terms with your tool provider'] },
    { k: 'Commitment up front', v: ['One phase; your planning session is free', 'You sign a contract for several phases before launch', 'A full-time employee', 'No contract; maintenance is on you'] },
    { k: 'After launch', v: ['We maintain it and build the next workflow', 'You pay for changes or take over the upkeep', 'Depends on whether that person stays', 'You fix it when the workflow changes'] },
  ],
};

/** `k` is the card's eyebrow; `icon` names a file in public/icons/ (Pixel Icon Library, see NOTICES.md). */
export const features = [
  { k: 'Automate', t: 'Workflow Automation', icon: 'cog', b: 'Automate the steps taking up your day, with your staff checking work that needs approval.' },
  { k: 'Report', t: 'Data & Reporting', icon: 'analytics', b: 'See current figures from your software without typing them in again.' },
  { k: 'Respond', t: 'Customer Operations', icon: 'user-headset', b: 'Help your staff answer customers and send quotes faster.' },
  { k: 'Reconcile', t: 'Back Office', icon: 'receipt', b: 'Cut mistakes in your invoices, payment matching, and monthly accounts.' },
  { k: 'Connect', t: 'Integrations', icon: 'link', b: 'Connect your software and spreadsheets so your staff can stop copying data between them.' },
  { k: 'Delegate', t: 'AI for multi-step jobs', icon: 'robot', b: 'Use AI for jobs with several steps, with records you can check and a way for your staff to stop it.' },
];

/** The Capabilities console (captain, 2026-09-21): three framed panels, each a
    heading, one line, and one of the playground animations (cards 01, 03, 09)
    running in its lower half. `title` is the window's mono title bar. */
export const consolePanels = [
  { id: 'workflow', title: '01 · Workflow builder', t: 'Draw the flow. It runs itself.', b: 'An email, invoice or order moves through every step on its own. Your staff only see the ones that need a decision.' },
  { id: 'chat', title: '02 · Agentic chat', t: 'Ask, and it takes the next step.', b: 'Your staff ask in plain words. The assistant looks it up in your systems and does the job.' },
  { id: 'contract', title: '03 · Contract review', t: 'Every clause read, the risky ones flagged.', b: 'AI checks the whole contract against your terms and points your lawyer at the clauses that need a look.' },
];

/** The six capability verbs, one mono line under the console so the list from
    the old tiles isn't lost. */
export const consoleStrip = features.map((f) => f.k);

/** The edgy page carries its own eight FAQs (worded differently from data.ts's). */
export const homeFaq = [
  { q: 'Does our data leave our systems?', a: 'Your software runs in your systems, where you control access and approvals and can check records of what happened.' },
  { q: 'What do you build on?', a: 'We connect to the business software, spreadsheets, and payment systems you use. You can run the code without a Sondri platform or license.' },
  { q: 'Who owns what you build?', a: 'You own the code and instructions for using it, including the connections to your other software.' },
  { q: 'What does it cost?', a: 'We quote a fixed price before each phase. You decide whether to fund the next one.' },
  { q: 'What if it doesn’t save what we agreed?', a: 'You agree with us on the time or cost savings before we start. If the software falls short, you keep the plan and measurements and owe nothing further.' },
  { q: 'How fast can we start?', a: 'The first call is free, the roadmap takes days, and working software follows in weeks.' },
  { q: 'Why not just hire an agency, or someone in-house?', a: 'Compare the cost and time to hire someone or use an agency with our price for one phase. You own the code we build and can have us maintain it, and we’ll recommend hiring if that suits your work better.' },
  { q: 'Do you use AI for everything?', a: 'We use AI if it helps with your job.' },
];

/** Section 1 · Hero */
export const hero = {
  h1: 'Fix expensive bullsh*t. (Use AI where it helps)',
  lede: 'Built into the systems you already run. Live in weeks.',
};

/** Section 2 · Capability scroll */
export const capabilityStrip = { eyebrow: 'What we do' };

/** Section 3 · Problem */
export const problem = {
  eyebrow: 'Problem',
  h2: 'Your people aren’t inefficient. Your software is.',
  lede: 'Your team spends hours on work your software doesn’t handle, and the quotes you’ve had to fix it cost too much.',
  close: 'How long has your fix been "in pilot"?',
};

/** Section 4 · Impact (was "Twist the knife") */
export const knifeHead = {
  eyebrow: 'Impact',
  h2: 'Kill your workarounds.',
  lede: 'The workaround feels cheap because nobody sends you an invoice for it.',
  close: 'Add up what those extra steps cost you each year.',
};

/** Section 5 · Solution & benefits */
export const solution = {
  eyebrow: 'Value',
  h2: 'We overhaul how work gets done.',
  lede: 'We build working software into the tools your team already uses, price each phase up front, and hand you the code.',
};

/** Section 6 · Endorsements (was "Customers"; captain, 2026-09-21) */
export const socialProof = {
  /** Hidden for now (captain, 2026-09-21) - the quotes are placeholders. Flip
      to true and the section renders again; nothing else to restore. */
  enabled: false,
  eyebrow: 'Endorsements',
  h2: 'People who’ve watched us work.',
  ph: 'All three are placeholders, shape only (name, role, company type). Replace with real endorsements before this ships.',
};

/** Section 7 · How it works */
export const howItWorks = {
  eyebrow: 'How it works',
  h2: 'Stop experimenting and start executing.',
  lede: 'You show us the work you want to fix, and we build with your team.',
};

/** Section 8 · Competitor comparison */
export const comparisonHead = {
  eyebrow: 'Competition',
  h2: 'A lot of consultants will charge you to rename your problem.',
  lede: 'Compare the time and money each option takes. Ask who’s responsible for fixing it after launch.',
  ph: 'Numbers marked [placeholder] need a source or a real engagement behind them before publishing.',
};

/** Section 9 · Capabilities (was "Features") */
export const featuresHead = {
  eyebrow: 'Capabilities',
  h2: 'Unsexy solutions that work ridiculously well.',
};

/* Section 10 · Why Sondri exists — removed (captain, 2026-09-21). */

/** Section 11 · FAQ */
export const faqHead = { eyebrow: 'FAQ', h2: 'Things people ask before they trust us with money.' };

/** Section 12 · Final CTA */
export const finalCta = {
  eyebrow: 'Get in touch',
  h2: 'Stop paying smart people to babysit stupid systems.',
  lede: 'Spend 30 minutes with us describing the pain you are having. We’ll tell you whether we can help or whether hiring someone would suit you better.',
};

/* ── Value panel: four jobs, before and after (captain's 2026-09-21 Value
   brief). Each step's `who` is the mono chip on the node: `staff` is a
   person doing the step by hand, `auto` is regular software, `ai` is the step
   the AI does. `after` steps that still have `staff` on them are the checks a
   person keeps. The savings are shape-only: every metric carries the
   [placeholder] mark until a real engagement stands behind it. ── */
export type StepWho = 'staff' | 'auto' | 'ai';
export interface ValueStep { who: StepWho; t: string }
export interface ValueMetric { k: string; t: string; before: number; after: number; unit: 'money' | 'hours' | 'people' }
export interface ValueCase {
  id: string;
  name: string;
  job: string;
  before: ValueStep[];
  after: ValueStep[];
  metrics: ValueMetric[];
}

export const valuePanel = {
  prompt: 'Pick a job and watch the work change.',
  before: 'Before — by hand',
  after: 'After — AI where it helps',
  who: { staff: 'Staff', auto: 'Auto', ai: 'AI' } as Record<StepWho, string>,
  legend: { before: 'Before', after: 'After' },
  steps: 'Before / after steps',
  toggle: 'Show steps',
  placeholder: '[placeholder]',
};

export const valueCases: ValueCase[] = [
  {
    id: 'service',
    name: 'Customer service',
    job: 'A customer emails to ask where their order is.',
    before: [
      { who: 'staff', t: 'Email lands in the shared inbox' },
      { who: 'staff', t: 'Someone opens the order system and finds the order' },
      { who: 'staff', t: 'Copies the tracking number into the courier site' },
      { who: 'staff', t: 'Types the reply by hand' },
      { who: 'staff', t: 'Logs the ticket in a spreadsheet' },
    ],
    after: [
      { who: 'auto', t: 'Email lands in the shared inbox' },
      { who: 'ai', t: 'AI reads it and pulls up the order' },
      { who: 'auto', t: 'Tracking fetched from the courier' },
      { who: 'ai', t: 'Reply drafted with the delivery date' },
      { who: 'staff', t: 'Your staff check it and send' },
    ],
    metrics: [
      { k: 'Money', t: 'Cost per month', before: 6400, after: 1900, unit: 'money' },
      { k: 'Time', t: 'Hours per week', before: 38, after: 9, unit: 'hours' },
      { k: 'People', t: 'People on the job', before: 3, after: 1, unit: 'people' },
    ],
  },
  {
    id: 'accounting',
    name: 'Accounting',
    job: 'A supplier invoice arrives and needs paying.',
    before: [
      { who: 'staff', t: 'Invoice PDF arrives by email' },
      { who: 'staff', t: 'Someone keys it into the accounting system' },
      { who: 'staff', t: 'Matches it to the purchase order by eye' },
      { who: 'staff', t: 'Emails the manager for approval' },
      { who: 'staff', t: 'Chases the reply a week later' },
      { who: 'staff', t: 'Schedules the payment' },
    ],
    after: [
      { who: 'auto', t: 'Invoice PDF arrives by email' },
      { who: 'ai', t: 'AI reads the amounts and the PO number' },
      { who: 'auto', t: 'Matched against the purchase order' },
      { who: 'staff', t: 'Manager approves with one click' },
      { who: 'auto', t: 'Payment scheduled in your accounting system' },
    ],
    metrics: [
      { k: 'Money', t: 'Cost per month', before: 5200, after: 1100, unit: 'money' },
      { k: 'Time', t: 'Hours per week', before: 30, after: 6, unit: 'hours' },
      { k: 'People', t: 'People on the job', before: 2, after: 1, unit: 'people' },
    ],
  },
  {
    id: 'sales',
    name: 'Sales deal progression',
    job: 'A quote goes out and needs following up.',
    before: [
      { who: 'staff', t: 'Rep writes the quote in Word' },
      { who: 'staff', t: 'Emails it to the customer' },
      { who: 'staff', t: 'Updates the CRM stage by hand' },
      { who: 'staff', t: 'Sets a reminder in their calendar' },
      { who: 'staff', t: 'Follows up when they remember' },
    ],
    after: [
      { who: 'staff', t: 'Rep picks the products' },
      { who: 'auto', t: 'Quote built from your price list' },
      { who: 'auto', t: 'Sent and logged in the CRM' },
      { who: 'ai', t: 'Follow-up drafted by AI on day three' },
      { who: 'staff', t: 'Rep sends it or picks up the phone' },
    ],
    metrics: [
      { k: 'Money', t: 'Cost per month', before: 7800, after: 2600, unit: 'money' },
      { k: 'Time', t: 'Hours per week', before: 44, after: 14, unit: 'hours' },
      { k: 'People', t: 'People on the job', before: 4, after: 2, unit: 'people' },
    ],
  },
  {
    id: 'legal',
    name: 'Legal: contract review',
    job: 'A customer sends back your contract with their changes.',
    before: [
      { who: 'staff', t: 'Contract arrives as an email attachment' },
      { who: 'staff', t: 'Paralegal saves it to the shared drive' },
      { who: 'staff', t: 'Compares it to your standard terms line by line' },
      { who: 'staff', t: 'Writes up the changes in an email' },
      { who: 'staff', t: 'Lawyer reviews the whole thing again' },
    ],
    after: [
      { who: 'auto', t: 'Contract arrives and is filed' },
      { who: 'ai', t: 'AI compares it to your standard terms' },
      { who: 'ai', t: 'Changed clauses flagged with what they cost you' },
      { who: 'auto', t: 'Summary sent to the lawyer' },
      { who: 'staff', t: 'Lawyer reviews the flagged clauses only' },
    ],
    metrics: [
      { k: 'Money', t: 'Cost per month', before: 9600, after: 3200, unit: 'money' },
      { k: 'Time', t: 'Hours per week', before: 24, after: 7, unit: 'hours' },
      { k: 'People', t: 'People on the job', before: 2, after: 1, unit: 'people' },
    ],
  },
];
