/* The solutions matrix: solution areas across, industries down. A named
   solution (src/content/solutions/) sits on one industry row and is marked in
   every area it uses. Plain data, so content.config.ts can read it too. Add a
   column or a row here. */
export const areas = [
  {
    id: 'market-intel',
    name: 'Market Intelligence & Lead Generation',
    workaround: 'Hours in slow map tools and spreadsheets deciding where to look and who to call.',
    builds: 'Maps, parcel details and comparable-based pricing in one screen, so the team works the right opportunities first.',
    items: ['Maps & parcel search', 'Priority-coded leads', 'Pricing from comparable sales'],
  },
  {
    id: 'growth',
    name: 'Growth & Visibility',
    workaround: 'Paying an agency for reports, or publishing nothing at all.',
    builds: 'Search, answer-engine visibility, your website and a content engine that keeps it fed.',
    items: ['SEO', 'AEO', 'Website', 'Content'],
  },
  {
    id: 'sales',
    name: 'Sales & Pipeline Automation',
    workaround: 'Deals stalling in inboxes, spreadsheets and sticky notes.',
    builds: 'Pipelines, follow-ups and handoffs that move without someone chasing them.',
    items: ['Pipeline', 'Follow-ups', 'Handoffs'],
  },
  {
    id: 'modeling',
    name: 'Modeling & Context Engineering',
    workaround: 'Generic AI that doesn’t know your business, so nobody trusts its answers.',
    builds: 'Knowledge bases, context engines and tuned models built on your own data and rules.',
    items: ['Knowledge bases', 'Context engines', 'Model tuning'],
  },
] as const;

export const industries = [
  { id: 'real-estate', name: 'Real Estate' },
  { id: 'medical', name: 'Medical' },
  { id: 'events', name: 'Events' },
  { id: 'tourism', name: 'Tourism' },
  { id: 'legal', name: 'Legal' },
] as const;

export type AreaId = (typeof areas)[number]['id'];
export type IndustryId = (typeof industries)[number]['id'];
export const areaIds = areas.map((a) => a.id) as [AreaId, ...AreaId[]];
export const industryIds = industries.map((i) => i.id) as [IndustryId, ...IndustryId[]];

export const areaName = (id: AreaId) => areas.find((a) => a.id === id)!.name;
export const industryName = (id: IndustryId) => industries.find((i) => i.id === id)!.name;
