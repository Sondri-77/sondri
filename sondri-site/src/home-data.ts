/* VARIANT V2 — "edgy". Derek's reviewed voice (decisions.md D4) with the
   body headings eased in register but the hero keeping its edge, asterisked.
   The professional/simplify reading lives in V3 instead. Diverges from the
   workbench, so the provenance note below no longer holds for the headings
   listed in the branch commits.

   Home copy — the locked 12 sections (decisions.md D1) in the reviewed edgy
   voice (decisions.md D4). Every other string here is verbatim from
   copy-workbench/src/pages/home-edgy.astro @ aef397a (after banned-copy
   rounds 1+2 and the captain's tweaks) — the PRIMARY (1/3) heading of each
   section, the eyebrow, body, lists, [placeholder] marks — with one captain
   addendum: the hero keeps only the one sub-heading (button labels and
   micro-copy come from data.ts). The stat labels and capability strip that
   the workbench takes from its shared copy.ts live here too, so the home
   page reads as one reviewed unit.
   The captain reviews copy in the workbench, not here. Do not edit copy in
   this file; change the workbench and re-copy. */

/** Footer line (in the footer, not the hero). */
export const VALUE_LINE =
  'We fix the work costing your team time and money, using AI where it helps.';

export const problemStats = [
  { n: '88%', label: 'of large-company AI trials never reach everyday use.' },
  { n: '$2M+', label: 'typical bill for connecting business systems before launch.' },
  { n: '9 mo.', label: 'average time to launch with a traditional provider.' },
];

export const capabilities = [
  'Workflow Automation',
  'Data & Reporting',
  'Customer Operations',
  'Back Office',
  'Integrations',
  'AI for multi-step jobs',
];

export const knife = [
  { t: 'Money', b: 'Count the time each person on your team spends on the workaround. [placeholder: cost-of-inaction calculator]' },
  { t: 'Time', b: 'As your orders grow, your team has more manual work to do.' },
  { t: 'People', b: 'Your experienced staff spend hours on data entry. If someone leaves, you may have to work out their steps again.' },
];

export const benefits = [
  { t: 'Cost and savings', b: 'Pick a cost to cut or a way to increase revenue. We measure the change.' },
  { t: 'Your systems, your code', b: 'Built into the software and spreadsheets you already use. You own the code.' },
  { t: 'One phase at a time', b: 'Agree on a fixed price for each phase, then review the work before funding the next.' },
];

export const testimonials = [
  { q: '[placeholder] "We’d been talking about fixing invoice matching for two years. Six weeks later it was live and we use it every day."', who: '[placeholder] COO, regional logistics company · [placeholder] 14 hrs/week back to the finance team' },
  { q: '[placeholder] "They told us on the first call which of our three ideas was worth doing. That’s why we hired them."', who: '[placeholder] CFO, mid-market manufacturer · [placeholder] first software in use in 7 weeks' },
  { q: '[placeholder] "Our team owns the code and can read every line."', who: '[placeholder] Head of Ops, healthcare services group · [placeholder] $180k annual cost gone' },
];

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

/** `icon` names a file in public/icons/ (Pixel Icon Library, see NOTICES.md). */
export const features = [
  { t: 'Workflow Automation', icon: 'cog', b: 'Automate the steps taking up your day, with your staff checking work that needs approval.' },
  { t: 'Data & Reporting', icon: 'analytics', b: 'See current figures from your software without typing them in again.' },
  { t: 'Customer Operations', icon: 'user-headset', b: 'Help your staff answer customers and send quotes faster.' },
  { t: 'Back Office', icon: 'receipt', b: 'Cut mistakes in your invoices, payment matching, and monthly accounts.' },
  { t: 'Integrations', icon: 'link', b: 'Connect your software and spreadsheets so your staff can stop copying data between them.' },
  { t: 'AI for multi-step jobs', icon: 'robot', b: 'Use AI for jobs with several steps, with records you can check and a way for your staff to stop it.' },
];

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
  h1: 'Fix the Expensive Bullsh*t.',
  lede: 'Built into the systems you already run, using AI where it helps. Live in weeks.',
};

/** Section 2 · Capability scroll */
export const capabilityStrip = { eyebrow: 'Things we do' };

/** Section 3 · Problem */
export const problem = {
  eyebrow: 'Problem',
  h2: 'Your people aren’t the bottleneck, the software is.',
  lede: 'Your team spends hours on work your software doesn’t handle, and the quotes you’ve had to fix it cost too much.',
  close: 'How long has your fix been "in pilot"?',
};

/** Section 4 · Twist the knife */
export const knifeHead = {
  eyebrow: 'Twist the knife',
  h2: 'That workaround has been temporary for years.',
  lede: 'The workaround feels cheap because nobody sends you an invoice for it.',
  close: 'Add up what those extra steps cost you each week.',
};

/** Section 5 · Solution & benefits */
export const solution = {
  eyebrow: 'Solution & benefits',
  h2: 'We fix how the work gets done.',
  lede: 'You choose three jobs worth fixing with us. We build for the first and reuse what we can for the next.',
};

/** Section 6 · Social proof */
export const socialProof = {
  eyebrow: 'Social proof',
  h2: 'Hear from customers using what we built.',
  ph: 'All three are placeholders, shape only (role, company type, number). Replace with real customer quotes before this ships.',
};

/** Section 7 · How it works */
export const howItWorks = {
  eyebrow: 'How it works',
  h2: 'Just fix the thing that’s broken.',
  lede: 'You show us the work you want to fix, and we build with your team.',
};

/** Section 8 · Competitor comparison */
export const comparisonHead = {
  eyebrow: 'Competitor comparison',
  h2: 'A lot of consultants will charge you to rename your problem.',
  lede: 'Compare the time and money each option takes. Ask who’s responsible for fixing it after launch.',
  ph: 'Numbers marked [placeholder] need a source or a real engagement behind them before publishing.',
};

/** Section 9 · Features */
export const featuresHead = {
  eyebrow: 'Features',
  h2: 'Unglamorous software that works remarkably well.',
};

/** Section 10 · Why Sondri exists */
export const why = {
  eyebrow: 'Why Sondri exists',
  h2: 'Let’s fix the work you have now.',
  quote: 'We started Sondri because we saw businesses spend eighteen months trying AI without getting software they could use. You can bring us one job that needs fixing, and we’ll build software for it.',
  line: 'Show us how you do the job today.',
  cta: 'Get in Touch →',
  href: '#contact',
};

/** Section 11 · FAQ */
export const faqHead = { eyebrow: 'FAQ', h2: 'Things people ask before they trust us with money.' };

/** Section 12 · Final CTA */
export const finalCta = {
  eyebrow: 'Final CTA',
  h2: 'Stop paying smart people to babysit broken systems.',
  lede: 'Spend thirty minutes with a founder on the job you want to fix. We’ll tell you whether we can help or whether hiring someone would suit you better.',
};
