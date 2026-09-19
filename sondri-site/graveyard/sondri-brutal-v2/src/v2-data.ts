/* Copy specific to this layout. The OCI template has slots the main site
   doesn't — a section index code, a service grid, a numbered project index,
   a rotating principle, a contact block. Everything else comes from data.ts. */

export const nav = [
  { label: 'Problem', href: '#problem' },
  { label: 'Solution', href: '#solution' },
  { label: 'How it works', href: '#how' },
  { label: 'What we build', href: '#features' },
];

export const navSecondary = [
  { label: 'Why Sondri', href: '#why' },
  { label: 'FAQ', href: '#faq' },
];

/** Hero support paragraphs — the two columns under the headline. */
export const heroSupport = [
  'From the first conversation to the workflow running in production, Sondri is beside your operators — mapping the work, building on the systems you already run, and handing you the keys.',
  'Senior architects design and hold the quality gate. A vetted specialist network builds against the blueprint. Your team is in the room from week one.',
];

/** Service grid — capabilities, given the copy the cards need. */
export const services = [
  {
    name: 'Workflow Automation',
    body: 'The work that eats your team’s week — mapped, rebuilt, and running without the manual touches.',
  },
  {
    name: 'Data & Reporting',
    body: 'One trusted view across the systems you already run, so the number in the meeting is the number in the ledger.',
  },
  {
    name: 'Customer Operations',
    body: 'Queues, triage, and response handled at machine speed, with your people on the decisions that matter.',
  },
  {
    name: 'Back Office',
    body: 'Invoicing, reconciliation, and approvals with the audit trail your finance team and your auditors expect.',
  },
  {
    name: 'Integrations',
    body: 'ERP, CRM, spreadsheets, payments — connected properly, so data stops being re-keyed between them.',
  },
  {
    name: 'Agentic AI Solutions',
    body: 'Agents that run real workflows end to end, inside your controls, with approvals and guardrails from day one.',
  },
];

/** Category tags for the framework index, mirroring the project cards. */
export const phaseTags = ['Prove', 'Production', 'Multiply'];

/** The news list becomes the questions list — same row anatomy. */
export const questionTags = ['Security', 'Stack', 'Ownership', 'Price', 'Risk', 'Timing', 'Alternatives', 'AI'];

export const contact = {
  address: ['Sondri', 'Digital-first, wherever your operators are'],
};

export const footerNav = [
  { label: 'Problem', href: '#problem' },
  { label: 'Solution', href: '#solution' },
  { label: 'How it works', href: '#how' },
  { label: 'What we build', href: '#features' },
  { label: 'Why Sondri', href: '#why' },
  { label: 'FAQ', href: '#faq' },
];

export const footerLegal = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms and Conditions', href: '#terms' },
];
