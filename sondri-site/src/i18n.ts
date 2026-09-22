/* Every visible string the site renders, in both languages. `en` is the
   reviewed copy (home-data.ts re-exports it, so the components and the
   workbench round-trip keep their shape); `es` is the Spanish version for
   small-business owners in the US and Latin America: plain, usted, no
   profanity anywhere (the swears in the English headings become plain
   phrases that keep the point, e.g. "Fix expensive bullsh*t." →
   "Arreglamos errores caros."). The `[placeholder]` token stays literal in
   both so the site-wide grep still finds it.
   The nav, CTA and footer strings that data.ts / brutal-data.ts own are
   read from there for `en` so they stay single-sourced. src/lib/i18n.ts
   flattens a `Copy` into the `data-i18n` keys the toggle swaps by. */
import { CTA_PRIMARY, RISK_REVERSAL, framework } from './data';
import { announcement, footerCols, nav } from './brutal-data';

export type Lang = 'en' | 'es';

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

export interface CalcInput {
  id: string; k: string; t: string; change: string; unit: string;
  min: number; max: number; step: number; value: number; money: boolean;
}

export interface Copy {
  meta: { title: string; description: string; lang: string };
  ui: {
    skip: string; brandHome: string; primaryNav: string; menu: string; close: string;
    contact: string; language: string; english: string; spanish: string;
  };
  announcement: { text: string; cta: string };
  nav: { label: string; href: string }[];
  cta: string;
  riskReversal: string;
  VALUE_LINE: string;
  footerCols: { title: string; links: { label: string; href: string }[] }[];
  footerLine: string;
  problemStats: { k: string; n: string; label: string }[];
  capabilities: string[];
  calculator: {
    inputs: CalcInput[];
    person: string; people: string; week: string; on: string; sum: string; yearSentence: string;
    year: string; hint: string;
  };
  benefits: { k: string; icon: string; t: string; b: string }[];
  testimonials: { q: string; who: string }[];
  steps: { i: string; t: string; b: string }[];
  comparison: { cols: string[]; rows: { k: string; v: string[] }[] };
  features: { k: string; t: string; icon: string; b: string }[];
  consolePanels: { id: string; title: string; t: string; b: string }[];
  consoleStripLabel: string;
  workflowAnim: { aria: string; tag: string; detail: string; nodes: { lbl: string; detail: string }[] };
  chatAnim: { assistant: string; online: string; agent: string; foot: string; exchanges: string[][] };
  contractAnim: {
    head: string; foot: string; clauses: string[]; risk: string; statClauses: string; statOk: string; statRisk: string;
    flags: string[]; summary1: string; summary2: string;
  };
  homeFaq: { q: string; a: string }[];
  hero: { h1: string; lede: string };
  capabilityStrip: { eyebrow: string };
  problem: { eyebrow: string; h2: string; lede: string; close: string };
  knifeHead: { eyebrow: string; h2: string; lede: string; close: string };
  solution: { eyebrow: string; h2: string; lede: string };
  socialProof: { enabled: boolean; eyebrow: string; h2: string; ph: string };
  howItWorks: { eyebrow: string; h2: string; lede: string; does: string; gets: string; phase: string };
  framework: { num: string; name: string; does: string; gets: string }[];
  comparisonHead: { eyebrow: string; h2: string; lede: string; ph: string };
  featuresHead: { eyebrow: string; h2: string };
  faqHead: { eyebrow: string; h2: string };
  finalCta: { eyebrow: string; h2: string; lede: string };
  valuePanel: {
    title: string; prompt: string; before: string; after: string;
    who: Record<StepWho, string>; legend: { before: string; after: string };
    steps: string; toggle: string; placeholder: string;
  };
  valueCases: ValueCase[];
  notFound: { title: string; description: string; h1: string; lede: string; back: string };
}

/* ────────────────────────────── English ────────────────────────────── */

const features = [
  { k: 'Automate', t: 'Workflow Automation', icon: 'cog', b: 'Automate the steps taking up your day, with your staff checking work that needs approval.' },
  { k: 'Report', t: 'Data & Reporting', icon: 'analytics', b: 'See current figures from your software without typing them in again.' },
  { k: 'Respond', t: 'Customer Operations', icon: 'user-headset', b: 'Help your staff answer customers and send quotes faster.' },
  { k: 'Reconcile', t: 'Back Office', icon: 'receipt', b: 'Cut mistakes in your invoices, payment matching, and monthly accounts.' },
  { k: 'Connect', t: 'Integrations', icon: 'link', b: 'Connect your software and spreadsheets so your staff can stop copying data between them.' },
  { k: 'Delegate', t: 'AI for multi-step jobs', icon: 'robot', b: 'Use AI for jobs with several steps, with records you can check and a way for your staff to stop it.' },
];

export const en: Copy = {
  meta: {
    title: 'Sondri — Fix expensive bullsh*t',
    description: 'Built into the systems you already run. Live in weeks. AI where it helps, regular software where it doesn’t.',
    lang: 'en',
  },
  ui: {
    skip: 'Skip to content',
    brandHome: 'Sondri — home',
    primaryNav: 'Primary',
    menu: 'Menu',
    close: 'Close',
    contact: 'Get in touch',
    language: 'Language',
    english: 'English',
    spanish: 'Español',
  },
  announcement,
  nav,
  cta: CTA_PRIMARY,
  riskReversal: RISK_REVERSAL,

  /** Footer line (in the footer, not the hero). */
  VALUE_LINE: 'We fix the work costing your team time and money, using AI where it helps.',
  footerCols,
  footerLine: 'Built in your systems, owned by you',

  /** `k` is the card's eyebrow (captain: labels, not numbers, on every card row
      except the How-it-works steps). */
  problemStats: [
    { k: 'Adoption', n: '88%', label: 'of large-company AI trials never reach everyday use.' },
    { k: 'Cost', n: '$2M+', label: 'typical bill for connecting business systems before launch.' },
    { k: 'Time', n: '9 mo.', label: 'average time to launch with a traditional provider.' },
  ],

  capabilities: [
    'Workflow Automation',
    'Data & Reporting',
    'Customer Operations',
    'Back Office',
    'Integrations',
    'AI for multi-step jobs',
  ],

  /** The Impact section's cost-of-inaction calculator, cost = wage × hours ×
      people × 52, read as one sentence (playground C3): each value is a bold
      gold word that opens its slider. `k` is the slider tray's label, `t` the
      input's accessible name, `change` the value's tooltip, `unit` the suffix
      on its value. `person`/`people` is the verb phrase after the head count. */
  calculator: {
    inputs: [
      { id: 'wage', k: 'Hourly wage', t: 'Hourly wage', change: 'Change hourly wage', unit: '/h', min: 15, max: 150, step: 1, value: 35, money: true },
      { id: 'hours', k: 'Hours a week', t: 'Hours per week, per person', change: 'Change hours per week, per person', unit: ' h', min: 1, max: 40, step: 1, value: 5, money: false },
      { id: 'people', k: 'People', t: 'People doing the workaround', change: 'Change people doing the workaround', unit: '', min: 1, max: 50, step: 1, value: 4, money: false },
    ],
    person: 'person spends',
    people: 'people spend',
    week: ' a week at ',
    on: ' on the workaround. ',
    sum: 'That’s ',
    yearSentence: ' a year.',
    year: 'per year',
    hint: 'Click a number to change it. Arrow keys work too.',
  },

  /** `k` is the card's eyebrow; `icon` names a file in public/icons/ (Pixel Icon Library, see NOTICES.md). */
  benefits: [
    { k: 'Outcome', icon: 'coins', t: 'Cost and savings', b: 'Pick a cost to cut or a way to increase revenue. We measure the change.' },
    { k: 'Ownership', icon: 'code', t: 'Your systems, your code', b: 'Built into the software and spreadsheets you already use. You own the code.' },
    { k: 'Commitment', icon: 'numbered-list', t: 'One phase at a time', b: 'Agree on a fixed price for each phase, then review the work before funding the next.' },
  ],

  /** Endorsements (captain, 2026-09-21: was "Customers"): three fictitious
      advisors / friends of the business on the Sondri method and why AI matters
      now. Shape only — every one is a [placeholder] until a real person signs it. */
  testimonials: [
    { q: '[placeholder] "They had a working version in front of my ops manager in the second week. Every other firm we spoke to wanted a strategy phase first."', who: '[placeholder] Dana Whitlock · Owner, regional HVAC contractor' },
    { q: '[placeholder] "Most small companies will get AI through the software they already own. Sondri builds it that way, and I haven’t seen another shop do it."', who: '[placeholder] Marcus Oyelaran · Advisor, former CIO of a food distributor' },
    { q: '[placeholder] "Doing this work by hand costs more every year and doing it with AI costs less. Waiting is now the expensive choice, and they tell you that plainly."', who: '[placeholder] Priya Natarajan · Partner, small-business accounting firm' },
  ],

  /* Superseded 2026-09-21: How it works now renders `framework` (0 / 1 / n). Kept for the workbench round-trip. */
  steps: [
    { i: '01', t: 'Tell us what’s slow', b: 'Spend thirty minutes describing the work slowing you down. You can come without preparing anything.' },
    { i: '02', t: 'We build it into your systems', b: 'You keep running your business while we build with your existing software and data.' },
    { i: '03', t: 'Check what changed', b: 'Compare the hours and money spent on the job before and after the build.' },
  ],

  comparison: {
    cols: ['Sondri', 'Software agency', 'Hiring in-house', 'DIY tools'],
    rows: [
      { k: 'Time until you can use it', v: ['Weeks [placeholder: 6–8]', 'Quarters [placeholder: 6–9 mo.]', 'Months to hire, then months to build', 'Days to try; integration takes longer'] },
      { k: 'What you pay', v: ['Fixed price per phase, quoted before it starts', 'You pay for hours and expenses', 'Salary + benefits + management, project or not', 'Low fees; you do the work'] },
      { k: 'Who owns the code', v: ['You; runs in your systems', 'Often the vendor’s platform or license', 'You', 'Check ownership terms with your tool provider'] },
      { k: 'Commitment up front', v: ['One phase; your planning session is free', 'You sign a contract for several phases before launch', 'A full-time employee', 'No contract; maintenance is on you'] },
      { k: 'After launch', v: ['We maintain it and build the next workflow', 'You pay for changes or take over the upkeep', 'Depends on whether that person stays', 'You fix it when the workflow changes'] },
    ],
  },

  /** `k` is the card's eyebrow; `icon` names a file in public/icons/ (Pixel Icon Library, see NOTICES.md). */
  features,

  /** The Capabilities console (captain, 2026-09-21): three framed panels, each a
      heading, one line, and one of the playground animations (cards 01, 03, 09)
      running in its lower half. `title` is the window's mono title bar. */
  consolePanels: [
    { id: 'workflow', title: '01 · Workflow builder', t: 'Draw the flow. It runs itself.', b: 'An email, invoice or order moves through every step on its own. Your staff only see the ones that need a decision.' },
    { id: 'chat', title: '02 · Agentic chat', t: 'Ask, and it takes the next step.', b: 'Your staff ask in plain words. The assistant looks it up in your systems and does the job.' },
    { id: 'contract', title: '03 · Contract review', t: 'Every clause read, the risky ones flagged.', b: 'AI checks the whole contract against your terms and points your lawyer at the clauses that need a look.' },
  ],
  consoleStripLabel: 'Capabilities',

  /* The three console animations' own text (playground cards 01, 03, 09). */
  workflowAnim: {
    aria: 'Email flows through parsing, CRM lookup, an amount check, posting and notification',
    tag: 'YOUR NEXT WORKFLOW',
    detail: '6 steps / 1 decision / no copy-paste',
    nodes: [
      { lbl: 'TRIGGER', detail: 'new email' },
      { lbl: 'PARSE', detail: 'extract' },
      { lbl: 'LOOKUP', detail: 'your CRM' },
      { lbl: 'IF > 5K', detail: 'check amount' },
      { lbl: 'POST', detail: 'your ERP' },
      { lbl: 'NOTIFY', detail: 'your team' },
    ],
  },
  chatAnim: {
    assistant: 'YOUR ASSISTANT',
    online: '■ ONLINE',
    agent: 'AGENT',
    foot: 'ASK → LOOK UP → TAKE ACTION',
    exchanges: [
      ['Where is order #4471?', '⚙ lookup_order(#4471)', 'Found · out for delivery', 'Your order arrives today by 5 pm.'],
      ['Can you approve my refund?', '⚙ check_refund(#4471)', 'Eligible · within 30 days', 'Your refund is approved. Allow 3 days.'],
      ['Book a call for tomorrow.', '⚙ find_slot(tomorrow)', 'Available · 10:30 am', 'Your call is booked for 10:30 am.'],
    ],
  },
  contractAnim: {
    head: 'YOUR AGREEMENT',
    foot: 'REVIEW / 14 CLAUSES',
    clauses: [
      '1.1 Scope: listed services', '2.1 Fees: due in 30 days', '3.1 Term: twelve months', '4.2 Renewal: automatic',
      '5.1 Data stays yours', '6.1 Access: named users', '7.1 Changes: in writing', '8.3 Liability: no cap',
      '9.1 Notices: by email', '10.1 Work stays yours', '11.1 Keep data private', '12.2 Exit: 30 days notice',
      '13.4 Venue: unspecified', '14.1 Signed by both',
    ],
    risk: 'RISK',
    statClauses: 'CLAUSES',
    statOk: 'OK',
    statRisk: 'RISK',
    flags: ['4.2 · Auto-renewal', '8.3 · No liability cap', '13.4 · Missing venue'],
    summary1: '3 clauses',
    summary2: 'need a look',
  },

  /** The edgy page carries its own eight FAQs (worded differently from data.ts's). */
  homeFaq: [
    { q: 'Does our data leave our systems?', a: 'Your software runs in your systems, where you control access and approvals and can check records of what happened.' },
    { q: 'What do you build on?', a: 'We connect to the business software, spreadsheets, and payment systems you use. You can run the code without a Sondri platform or license.' },
    { q: 'Who owns what you build?', a: 'You own the code and instructions for using it, including the connections to your other software.' },
    { q: 'What does it cost?', a: 'We quote a fixed price before each phase. You decide whether to fund the next one.' },
    { q: 'What if it doesn’t save what we agreed?', a: 'You agree with us on the time or cost savings before we start. If the software falls short, you keep the plan and measurements and owe nothing further.' },
    { q: 'How fast can we start?', a: 'The first call is free, the roadmap takes days, and working software follows in weeks.' },
    { q: 'Why not just hire an agency, or someone in-house?', a: 'Compare the cost and time to hire someone or use an agency with our price for one phase. You own the code we build and can have us maintain it, and we’ll recommend hiring if that suits your work better.' },
    { q: 'Do you use AI for everything?', a: 'We use AI if it helps with your job.' },
  ],

  /** Section 1 · Hero */
  hero: {
    h1: 'Fix expensive bullsh*t. (Use AI where it helps)',
    lede: 'Built into the systems you already run. Live in weeks.',
  },

  /** Section 2 · Capability scroll */
  capabilityStrip: { eyebrow: 'What we do' },

  /** Section 3 · Problem */
  problem: {
    eyebrow: 'Problem',
    h2: 'Your people aren’t inefficient. Your software is.',
    lede: 'Your team spends hours on work your software doesn’t handle, and the quotes you’ve had to fix it cost too much.',
    close: 'How long has your fix been "in pilot"?',
  },

  /** Section 4 · Impact (was "Twist the knife") */
  knifeHead: {
    eyebrow: 'Impact',
    h2: 'Kill your workarounds.',
    lede: 'The workaround feels cheap because nobody sends you an invoice for it.',
    close: 'Add up what those extra steps cost you each year.',
  },

  /** Section 5 · Solution & benefits */
  solution: {
    eyebrow: 'Value',
    h2: 'We overhaul how work gets done.',
    lede: 'We build working software into the tools your team already uses, price each phase up front, and hand you the code.',
  },

  /** Section 6 · Endorsements (was "Customers"; captain, 2026-09-21) */
  socialProof: {
    /** Hidden for now (captain, 2026-09-21) - the quotes are placeholders. Flip
        to true and the section renders again; nothing else to restore. */
    enabled: false,
    eyebrow: 'Endorsements',
    h2: 'People who’ve watched us work.',
    ph: 'All three are placeholders, shape only (name, role, company type). Replace with real endorsements before this ships.',
  },

  /** Section 7 · How it works */
  howItWorks: {
    eyebrow: 'How it works',
    h2: 'Stop experimenting and start executing.',
    lede: 'You show us the work you want to fix, and we build with your team.',
    does: 'What we do',
    gets: 'What you get',
    phase: 'Phase',
  },
  framework,

  /** Section 8 · Competitor comparison */
  comparisonHead: {
    eyebrow: 'Competition',
    h2: 'A lot of consultants will charge you to rename your problem.',
    lede: 'Compare the time and money each option takes. Ask who’s responsible for fixing it after launch.',
    ph: 'Numbers marked [placeholder] need a source or a real engagement behind them before publishing.',
  },

  /** Section 9 · Capabilities (was "Features") */
  featuresHead: {
    eyebrow: 'Capabilities',
    h2: 'Unsexy solutions that work ridiculously well.',
  },

  /* Section 10 · Why Sondri exists — removed (captain, 2026-09-21). */

  /** Section 11 · FAQ */
  faqHead: { eyebrow: 'FAQ', h2: 'Things people ask before they trust us with money.' },

  /** Section 12 · Final CTA */
  finalCta: {
    eyebrow: 'Get in touch',
    h2: 'Stop paying smart people to babysit stupid systems.',
    lede: 'Spend 30 minutes with us describing the pain you are having. We’ll tell you whether we can help or whether hiring someone would suit you better.',
  },

  /* ── Value panel: four jobs, before and after (captain's 2026-09-21 Value
     brief). Each step's `who` is the mono chip on the node: `staff` is a
     person doing the step by hand, `auto` is regular software, `ai` is the step
     the AI does. `after` steps that still have `staff` on them are the checks a
     person keeps. The savings are shape-only: every metric carries the
     [placeholder] mark until a real engagement stands behind it. ── */
  valuePanel: {
    title: 'Sondri / before → after',
    prompt: 'Pick a job and watch the work change.',
    before: 'Before — by hand',
    after: 'After — AI where it helps',
    who: { staff: 'Staff', auto: 'Auto', ai: 'AI' },
    legend: { before: 'Before', after: 'After' },
    steps: 'Before / after steps',
    toggle: 'Show steps',
    placeholder: '[placeholder]',
  },

  valueCases: [
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
  ],

  notFound: {
    title: '404 — Sondri',
    description: 'The page you requested does not exist.',
    h1: 'Nothing here.',
    lede: 'The page you requested does not exist, or has been moved.',
    back: 'Back to the front page',
  },
};

/* ────────────────────────────── Spanish ──────────────────────────────
   Usted throughout (the safe register for business across the US and
   Latin America); "parche" for "workaround"; USD stays USD. The English
   swears map to: "Fix expensive bullsh*t." → "Arreglamos errores caros.",
   "Kill your workarounds." → "Elimine los parches.", "We overhaul how
   work gets done." → "Rehacemos cómo se hace el trabajo.", "Stop paying
   smart people to babysit stupid systems." → "Deje de pagar a gente capaz
   para cuidar sistemas torpes.", "Unsexy solutions that work ridiculously
   well." → "Soluciones poco vistosas que funcionan increíblemente bien." */

const featuresEs = [
  { k: 'Automatizar', t: 'Automatización de flujos', icon: 'cog', b: 'Automatice los pasos que le quitan el día, con su equipo revisando lo que necesita aprobación.' },
  { k: 'Reportar', t: 'Datos e informes', icon: 'analytics', b: 'Vea las cifras actuales de su software sin volver a teclearlas.' },
  { k: 'Responder', t: 'Atención al cliente', icon: 'user-headset', b: 'Ayude a su equipo a responder a los clientes y enviar cotizaciones más rápido.' },
  { k: 'Conciliar', t: 'Administración', icon: 'receipt', b: 'Reduzca los errores en facturas, conciliación de pagos y cierres mensuales.' },
  { k: 'Conectar', t: 'Integraciones', icon: 'link', b: 'Conecte su software y sus hojas de cálculo para que su equipo deje de copiar datos de un lado a otro.' },
  { k: 'Delegar', t: 'IA para trabajos de varios pasos', icon: 'robot', b: 'Use IA en trabajos de varios pasos, con registros que puede revisar y una forma de que su equipo la detenga.' },
];

export const es: Copy = {
  meta: {
    title: 'Sondri — Arreglamos errores caros',
    description: 'Integrado en los sistemas que ya usa. En marcha en semanas. IA donde ayuda, software normal donde no.',
    lang: 'es',
  },
  ui: {
    skip: 'Ir al contenido',
    brandHome: 'Sondri — inicio',
    primaryNav: 'Principal',
    menu: 'Menú',
    close: 'Cerrar',
    contact: 'Escríbanos',
    language: 'Idioma',
    english: 'English',
    spanish: 'Español',
  },
  announcement: { text: 'Hay cupo para sesiones en el cuarto trimestre', cta: 'Reserve la suya' },
  nav: [
    { label: 'Cómo funciona', href: '#how' },
    { label: 'Método', href: '#framework' },
    { label: 'Comparar', href: '#compare' },
    { label: 'Preguntas', href: '#faq' },
  ],
  cta: 'Agende una sesión gratis',
  riskReversal: 'Gratis. Sin compromiso.',

  VALUE_LINE: 'Arreglamos el trabajo que le cuesta tiempo y dinero a su equipo, con IA donde ayuda.',
  footerCols: [
    { title: 'Empresa', links: [{ label: 'Cómo funciona', href: '#how' }, { label: 'Qué construimos', href: '#features' }] },
    { title: 'Hablemos', links: [{ label: 'Agendar sesión', href: '#book' }, { label: 'Escríbanos', href: '#contact' }, { label: 'Preguntas', href: '#faq' }] },
  ],
  footerLine: 'Construido en sus sistemas, y es suyo',

  problemStats: [
    { k: 'Adopción', n: '88%', label: 'de las pruebas de IA en empresas grandes nunca llegan al uso diario.' },
    { k: 'Costo', n: '$2M+', label: 'factura típica por conectar los sistemas de la empresa antes de arrancar.' },
    { k: 'Tiempo', n: '9 meses', label: 'tiempo promedio para arrancar con un proveedor tradicional.' },
  ],

  capabilities: [
    'Automatización de flujos',
    'Datos e informes',
    'Atención al cliente',
    'Administración',
    'Integraciones',
    'IA para trabajos de varios pasos',
  ],

  calculator: {
    inputs: [
      { id: 'wage', k: 'Salario por hora', t: 'Salario por hora', change: 'Cambiar el salario por hora', unit: '/h', min: 15, max: 150, step: 1, value: 35, money: true },
      { id: 'hours', k: 'Horas a la semana', t: 'Horas por semana, por persona', change: 'Cambiar las horas por semana, por persona', unit: ' h', min: 1, max: 40, step: 1, value: 5, money: false },
      { id: 'people', k: 'Personas', t: 'Personas que hacen el parche', change: 'Cambiar las personas que hacen el parche', unit: '', min: 1, max: 50, step: 1, value: 4, money: false },
    ],
    person: 'persona dedica',
    people: 'personas dedican',
    week: ' a la semana, a ',
    on: ' en el parche. ',
    sum: 'Son ',
    yearSentence: ' al año.',
    year: 'al año',
    hint: 'Haga clic en un número para cambiarlo. Las flechas del teclado también sirven.',
  },

  benefits: [
    { k: 'Resultado', icon: 'coins', t: 'Costos y ahorros', b: 'Elija un costo que recortar o una forma de vender más. Nosotros medimos el cambio.' },
    { k: 'Propiedad', icon: 'code', t: 'Sus sistemas, su código', b: 'Integrado en el software y las hojas de cálculo que ya usa. El código es suyo.' },
    { k: 'Compromiso', icon: 'numbered-list', t: 'Una fase a la vez', b: 'Acordamos un precio fijo por cada fase y usted revisa el trabajo antes de pagar la siguiente.' },
  ],

  testimonials: [
    { q: '[placeholder] "Tenían una versión funcionando frente a mi gerente de operaciones en la segunda semana. Todas las demás firmas querían empezar con una fase de estrategia."', who: '[placeholder] Dana Whitlock · Dueña, contratista regional de climatización' },
    { q: '[placeholder] "La mayoría de las empresas pequeñas van a llegar a la IA por el software que ya tienen. Sondri la construye así, y no he visto a nadie más hacerlo."', who: '[placeholder] Marcus Oyelaran · Asesor, ex director de sistemas de una distribuidora de alimentos' },
    { q: '[placeholder] "Hacer este trabajo a mano cuesta más cada año y hacerlo con IA cuesta menos. Esperar ya es la opción cara, y ellos se lo dicen sin rodeos."', who: '[placeholder] Priya Natarajan · Socia, despacho contable para pequeñas empresas' },
  ],

  steps: [
    { i: '01', t: 'Cuéntenos qué va lento', b: 'Dedique treinta minutos a describir el trabajo que lo frena. Puede venir sin preparar nada.' },
    { i: '02', t: 'Lo construimos en sus sistemas', b: 'Usted sigue con su negocio mientras construimos con el software y los datos que ya tiene.' },
    { i: '03', t: 'Revise qué cambió', b: 'Compare las horas y el dinero que se iban en la tarea antes y después.' },
  ],

  comparison: {
    cols: ['Sondri', 'Agencia de software', 'Contratar en la empresa', 'Herramientas por su cuenta'],
    rows: [
      { k: 'Tiempo hasta poder usarlo', v: ['Semanas [placeholder: 6–8]', 'Trimestres [placeholder: 6–9 meses]', 'Meses para contratar y luego meses para construir', 'Días para probar; integrarlo toma más'] },
      { k: 'Qué paga', v: ['Precio fijo por fase, cotizado antes de empezar', 'Paga horas y gastos', 'Sueldo + prestaciones + supervisión, haya proyecto o no', 'Cuotas bajas; el trabajo lo hace usted'] },
      { k: 'Quién es dueño del código', v: ['Usted; corre en sus sistemas', 'Muchas veces la plataforma o licencia del proveedor', 'Usted', 'Revise las condiciones de propiedad con su proveedor'] },
      { k: 'Compromiso inicial', v: ['Una fase; la sesión de planeación es gratis', 'Firma un contrato por varias fases antes de arrancar', 'Un empleado de tiempo completo', 'Sin contrato; el mantenimiento corre por su cuenta'] },
      { k: 'Después de arrancar', v: ['Lo mantenemos y construimos el siguiente flujo', 'Paga los cambios o asume el mantenimiento', 'Depende de si esa persona se queda', 'Usted lo arregla cuando el flujo cambia'] },
    ],
  },

  features: featuresEs,

  consolePanels: [
    { id: 'workflow', title: '01 · Constructor de flujos', t: 'Dibuje el flujo. Corre solo.', b: 'Un correo, una factura o un pedido pasa por cada paso por sí solo. Su equipo solo ve los que requieren una decisión.' },
    { id: 'chat', title: '02 · Chat con agente', t: 'Pregunte, y da el siguiente paso.', b: 'Su equipo pregunta con palabras sencillas. El asistente lo busca en sus sistemas y hace el trabajo.' },
    { id: 'contract', title: '03 · Revisión de contratos', t: 'Cada cláusula leída, las riesgosas marcadas.', b: 'La IA revisa el contrato completo contra sus términos y le señala al abogado las cláusulas que hay que mirar.' },
  ],
  consoleStripLabel: 'Capacidades',

  workflowAnim: {
    aria: 'El correo pasa por lectura, búsqueda en el CRM, revisión del monto, registro y aviso',
    tag: 'SU PRÓXIMO FLUJO',
    detail: '6 pasos / 1 decisión / sin copiar y pegar',
    nodes: [
      { lbl: 'INICIO', detail: 'un correo' },
      { lbl: 'LEER', detail: 'extraer' },
      { lbl: 'BUSCAR', detail: 'su CRM' },
      { lbl: 'SI > 5K', detail: 'revisar monto' },
      { lbl: 'ANOTAR', detail: 'su ERP' },
      { lbl: 'AVISAR', detail: 'su equipo' },
    ],
  },
  chatAnim: {
    assistant: 'SU ASISTENTE',
    online: '■ EN LÍNEA',
    agent: 'AGENTE',
    foot: 'PREGUNTAR → BUSCAR → ACTUAR',
    exchanges: [
      ['¿Dónde está el pedido #4471?', '⚙ buscar_pedido(#4471)', 'Encontrado · en reparto', 'Su pedido llega hoy antes de las 5 pm.'],
      ['¿Pueden aprobar mi reembolso?', '⚙ revisar_reembolso(#4471)', 'Aplica · dentro de 30 días', 'Su reembolso está aprobado. Tarda 3 días.'],
      ['Agende una llamada para mañana.', '⚙ buscar_horario(mañana)', 'Disponible · 10:30 am', 'Su llamada queda para mañana a las 10:30 am.'],
    ],
  },
  contractAnim: {
    head: 'SU CONTRATO',
    foot: 'REVISIÓN / 14 CLÁUSULAS',
    clauses: [
      '1.1 Alcance: servicios listados', '2.1 Pago: a 30 días', '3.1 Plazo: doce meses', '4.2 Renovación: automática',
      '5.1 Sus datos son suyos', '6.1 Acceso: usuarios designados', '7.1 Cambios: por escrito', '8.3 Responsabilidad: sin tope',
      '9.1 Avisos: por correo', '10.1 El trabajo es suyo', '11.1 Datos confidenciales', '12.2 Salida: aviso de 30 días',
      '13.4 Jurisdicción: sin definir', '14.1 Firmado por ambos',
    ],
    risk: 'RIESGO',
    statClauses: 'CLÁUSULAS',
    statOk: 'OK',
    statRisk: 'RIESGO',
    flags: ['4.2 · Renovación automática', '8.3 · Sin tope de responsabilidad', '13.4 · Falta la jurisdicción'],
    summary1: '3 cláusulas',
    summary2: 'requieren revisión',
  },

  homeFaq: [
    { q: '¿Nuestros datos salen de nuestros sistemas?', a: 'Su software corre en sus sistemas, donde usted controla los accesos y las aprobaciones y puede revisar el registro de lo que pasó.' },
    { q: '¿Sobre qué construyen?', a: 'Nos conectamos al software de gestión, las hojas de cálculo y los sistemas de pago que ya usa. Puede ejecutar el código sin una plataforma ni una licencia de Sondri.' },
    { q: '¿Quién es dueño de lo que construyen?', a: 'Usted es dueño del código y de las instrucciones para usarlo, incluidas las conexiones con su otro software.' },
    { q: '¿Cuánto cuesta?', a: 'Cotizamos un precio fijo antes de cada fase. Usted decide si paga la siguiente.' },
    { q: '¿Y si no ahorra lo que acordamos?', a: 'Acordamos con usted el ahorro en tiempo o en dinero antes de empezar. Si el software no lo alcanza, se queda con el plan y las mediciones y no nos debe nada más.' },
    { q: '¿Qué tan rápido podemos empezar?', a: 'La primera llamada es gratis, el plan toma días y el software funcionando llega en semanas.' },
    { q: '¿Por qué no contratar una agencia, o a alguien en la empresa?', a: 'Compare el costo y el tiempo de contratar a alguien o a una agencia con nuestro precio por una fase. El código que construimos es suyo, puede pedirnos que lo mantengamos, y si contratar le conviene más, se lo diremos.' },
    { q: '¿Usan IA para todo?', a: 'Usamos IA si ayuda con su trabajo.' },
  ],

  hero: {
    h1: 'Arreglamos errores caros. (Usamos IA donde ayuda)',
    lede: 'Integrado en los sistemas que ya usa. En marcha en semanas.',
  },

  capabilityStrip: { eyebrow: 'Qué hacemos' },

  problem: {
    eyebrow: 'Problema',
    h2: 'Su gente no es ineficiente. Su software sí.',
    lede: 'Su equipo pierde horas en trabajo que su software no cubre, y las cotizaciones que le han dado para arreglarlo cuestan demasiado.',
    close: '¿Cuánto tiempo lleva su arreglo "en fase piloto"?',
  },

  knifeHead: {
    eyebrow: 'Impacto',
    h2: 'Elimine los parches.',
    lede: 'El parche parece barato porque nadie le manda la factura.',
    close: 'Sume lo que esos pasos de más le cuestan cada año.',
  },

  solution: {
    eyebrow: 'Valor',
    h2: 'Rehacemos cómo se hace el trabajo.',
    lede: 'Construimos software que funciona dentro de las herramientas que su equipo ya usa, cotizamos cada fase por adelantado y le entregamos el código.',
  },

  socialProof: {
    enabled: false,
    eyebrow: 'Recomendaciones',
    h2: 'Gente que nos ha visto trabajar.',
    ph: 'Las tres son [placeholder], solo la forma (nombre, cargo, tipo de empresa). Reemplace con recomendaciones reales antes de publicar.',
  },

  howItWorks: {
    eyebrow: 'Cómo funciona',
    h2: 'Deje de experimentar y empiece a ejecutar.',
    lede: 'Usted nos muestra el trabajo que quiere arreglar y nosotros lo construimos con su equipo.',
    does: 'Qué hacemos',
    gets: 'Qué recibe',
    phase: 'Fase',
  },
  framework: [
    {
      num: '0',
      name: 'Probar',
      does: 'Nos sentamos con quienes hacen el trabajo y buscamos la tarea donde un arreglo se paga más rápido.',
      gets: 'Un plan con el costo y el ahorro de esa tarea, y un precio fijo por construirlo.',
    },
    {
      num: '1',
      name: 'Producción',
      does: 'Construimos el primer arreglo dentro del software que ya usa, con su equipo revisando el trabajo sobre la marcha.',
      gets: 'Software funcionando en una tarea real, medido contra las horas y el dinero que gastaba antes.',
    },
    {
      num: 'n',
      name: 'Multiplicar',
      does: 'Lo mantenemos funcionando, lo afinamos y construimos la siguiente tarea sobre lo que ya existe.',
      gets: 'Cada arreglo después del primero es más rápido y más barato de construir, y todo es suyo.',
    },
  ],

  comparisonHead: {
    eyebrow: 'Competencia',
    h2: 'Muchos consultores le cobran por ponerle otro nombre a su problema.',
    lede: 'Compare el tiempo y el dinero que toma cada opción. Pregunte quién se hace responsable de arreglarlo después de arrancar.',
    ph: 'Las cifras marcadas [placeholder] necesitan una fuente o un proyecto real detrás antes de publicarse.',
  },

  featuresHead: {
    eyebrow: 'Capacidades',
    h2: 'Soluciones poco vistosas que funcionan increíblemente bien.',
  },

  faqHead: { eyebrow: 'Preguntas frecuentes', h2: 'Lo que la gente pregunta antes de confiarnos su dinero.' },

  finalCta: {
    eyebrow: 'Contacto',
    h2: 'Deje de pagar a gente capaz para cuidar sistemas torpes.',
    lede: 'Dedique 30 minutos a contarnos el problema que tiene. Le diremos si podemos ayudar o si le conviene más contratar a alguien.',
  },

  valuePanel: {
    title: 'Sondri / antes → después',
    prompt: 'Elija un trabajo y vea cómo cambia.',
    before: 'Antes — a mano',
    after: 'Después — IA donde ayuda',
    who: { staff: 'Equipo', auto: 'Auto', ai: 'IA' },
    legend: { before: 'Antes', after: 'Después' },
    steps: 'Pasos antes / después',
    toggle: 'Ver pasos',
    placeholder: '[placeholder]',
  },

  valueCases: [
    {
      id: 'service',
      name: 'Atención al cliente',
      job: 'Un cliente escribe para preguntar dónde está su pedido.',
      before: [
        { who: 'staff', t: 'El correo llega a la bandeja compartida' },
        { who: 'staff', t: 'Alguien abre el sistema de pedidos y busca el pedido' },
        { who: 'staff', t: 'Copia el número de guía en la página de la paquetería' },
        { who: 'staff', t: 'Escribe la respuesta a mano' },
        { who: 'staff', t: 'Registra el caso en una hoja de cálculo' },
      ],
      after: [
        { who: 'auto', t: 'El correo llega a la bandeja compartida' },
        { who: 'ai', t: 'La IA lo lee y abre el pedido' },
        { who: 'auto', t: 'El rastreo se consulta con la paquetería' },
        { who: 'ai', t: 'Respuesta redactada con la fecha de entrega' },
        { who: 'staff', t: 'Su equipo la revisa y la envía' },
      ],
      metrics: [
        { k: 'Dinero', t: 'Costo por mes', before: 6400, after: 1900, unit: 'money' },
        { k: 'Tiempo', t: 'Horas por semana', before: 38, after: 9, unit: 'hours' },
        { k: 'Personas', t: 'Personas en la tarea', before: 3, after: 1, unit: 'people' },
      ],
    },
    {
      id: 'accounting',
      name: 'Contabilidad',
      job: 'Llega la factura de un proveedor y hay que pagarla.',
      before: [
        { who: 'staff', t: 'La factura llega en PDF por correo' },
        { who: 'staff', t: 'Alguien la captura en el sistema contable' },
        { who: 'staff', t: 'La compara a ojo con la orden de compra' },
        { who: 'staff', t: 'Escribe al gerente para pedir aprobación' },
        { who: 'staff', t: 'Insiste una semana después' },
        { who: 'staff', t: 'Programa el pago' },
      ],
      after: [
        { who: 'auto', t: 'La factura llega en PDF por correo' },
        { who: 'ai', t: 'La IA lee los montos y el número de orden' },
        { who: 'auto', t: 'Se cruza con la orden de compra' },
        { who: 'staff', t: 'El gerente aprueba con un clic' },
        { who: 'auto', t: 'Pago programado en su sistema contable' },
      ],
      metrics: [
        { k: 'Dinero', t: 'Costo por mes', before: 5200, after: 1100, unit: 'money' },
        { k: 'Tiempo', t: 'Horas por semana', before: 30, after: 6, unit: 'hours' },
        { k: 'Personas', t: 'Personas en la tarea', before: 2, after: 1, unit: 'people' },
      ],
    },
    {
      id: 'sales',
      name: 'Seguimiento de ventas',
      job: 'Sale una cotización y hay que darle seguimiento.',
      before: [
        { who: 'staff', t: 'El vendedor redacta la cotización en Word' },
        { who: 'staff', t: 'La envía al cliente por correo' },
        { who: 'staff', t: 'Actualiza la etapa en el CRM a mano' },
        { who: 'staff', t: 'Se pone un recordatorio en el calendario' },
        { who: 'staff', t: 'Da seguimiento cuando se acuerda' },
      ],
      after: [
        { who: 'staff', t: 'El vendedor elige los productos' },
        { who: 'auto', t: 'Cotización armada con su lista de precios' },
        { who: 'auto', t: 'Enviada y registrada en el CRM' },
        { who: 'ai', t: 'Seguimiento redactado por la IA al tercer día' },
        { who: 'staff', t: 'El vendedor lo envía o toma el teléfono' },
      ],
      metrics: [
        { k: 'Dinero', t: 'Costo por mes', before: 7800, after: 2600, unit: 'money' },
        { k: 'Tiempo', t: 'Horas por semana', before: 44, after: 14, unit: 'hours' },
        { k: 'Personas', t: 'Personas en la tarea', before: 4, after: 2, unit: 'people' },
      ],
    },
    {
      id: 'legal',
      name: 'Legal: revisión de contratos',
      job: 'Un cliente devuelve su contrato con cambios.',
      before: [
        { who: 'staff', t: 'El contrato llega como adjunto por correo' },
        { who: 'staff', t: 'El asistente legal lo guarda en la carpeta compartida' },
        { who: 'staff', t: 'Lo compara línea por línea con sus términos estándar' },
        { who: 'staff', t: 'Resume los cambios en un correo' },
        { who: 'staff', t: 'El abogado vuelve a revisar todo' },
      ],
      after: [
        { who: 'auto', t: 'El contrato llega y se archiva' },
        { who: 'ai', t: 'La IA lo compara con sus términos estándar' },
        { who: 'ai', t: 'Cláusulas cambiadas marcadas con lo que le cuestan' },
        { who: 'auto', t: 'Resumen enviado al abogado' },
        { who: 'staff', t: 'El abogado revisa solo las cláusulas marcadas' },
      ],
      metrics: [
        { k: 'Dinero', t: 'Costo por mes', before: 9600, after: 3200, unit: 'money' },
        { k: 'Tiempo', t: 'Horas por semana', before: 24, after: 7, unit: 'hours' },
        { k: 'Personas', t: 'Personas en la tarea', before: 2, after: 1, unit: 'people' },
      ],
    },
  ],

  notFound: {
    title: '404 — Sondri',
    description: 'La página que busca no existe.',
    h1: 'Aquí no hay nada.',
    lede: 'La página que busca no existe o se movió.',
    back: 'Volver a la página principal',
  },
};

export const copy: Record<Lang, Copy> = { en, es };
