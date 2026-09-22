/* Copy that only this layout needs — the Blacksmith template has slots the
   main site doesn't (announcement bar, comparison matrix, big number band).
   Everything else comes from data.ts, unchanged. */

export const announcement = {
  text: 'Discovery sessions for Q4 are open',
  cta: 'Book yours',
};

export const nav = [
  { label: 'How it works', href: '#how' },
  { label: 'Framework', href: '#framework' },
  { label: 'Compare', href: '#compare' },
  { label: 'FAQ', href: '#faq' },
];

/** Hero terminal — a workflow, before and after. */
export const heroTerminal = [
  { k: 'workflow', v: 'invoice-reconciliation' },
  { k: 'before', v: '6 people · 11 hrs/week' },
  { k: 'after', v: '1 approver · 20 min/week' },
  { k: 'shipped', v: 'week 04' },
];

/** The comparison matrix, section-by-section like the template's. */
export const matrix = {
  cols: ['Sondri', 'Systems integrator', 'In-house build'],
  groups: [
    {
      name: 'Speed',
      rows: [
        { label: 'Time to first working software', v: ['Weeks', '9 months', '2–4 quarters'] },
        { label: 'Discovery cost', v: ['Free', 'Paid engagement', 'Your team’s quarter'] },
        { label: 'New use cases after the first', v: ['Steady cadence', 'New SOW each time', 'Backlog queue'] },
      ],
    },
    {
      name: 'Cost',
      rows: [
        { label: 'Spend before value lands', v: ['Low', '$2M+', 'High'] },
        { label: 'Pricing model', v: ['Fixed per phase', 'Time & materials', 'Headcount'] },
        { label: 'Platform licence', v: ['None', 'Usually', 'None'] },
      ],
    },
    {
      name: 'Control',
      rows: [
        { label: 'Runs in your environment', v: [true, false, true] },
        { label: 'You own the code', v: [true, false, true] },
        { label: 'Audit trails and approvals', v: [true, true, false] },
        { label: 'Your operators trained on it', v: [true, false, true] },
      ],
    },
  ],
};

export const numbers = [
  { n: '3', label: 'Use cases scoped in every discovery' },
  { n: '4 wks', label: 'Discover to deployed, typically' },
  { n: '20–30%', label: 'Of US consulting rates, same quality gate' },
];

export const footerCols = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'How it works', href: '#how' },
      { label: 'What we build', href: '#features' },
    ],
  },
  {
    title: 'Engage',
    links: [
      { label: 'Book discovery', href: '#book' },
      { label: 'Get in touch', href: '#contact' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#privacy' },
      { label: 'Terms', href: '#terms' },
    ],
  },
];
