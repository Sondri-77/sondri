/* Home copy — the locked sections (decisions.md D1) in the reviewed edgy
   voice (decisions.md D4). The strings now live in i18n.ts (`en`, beside
   the Spanish `es`) so a copy edit touches one place; this module keeps
   the shape the components import. The captain reviews copy in the
   workbench, not here; the 2026-09-21 site-fix brief (eyebrows, asterisked
   swears, "overhaul", "Kill your workarounds", card labels, the cost
   calculator) was applied to `en` directly and still needs carrying back
   to the workbench. */
import { en } from './i18n';

export type { StepWho, ValueStep, ValueMetric, ValueCase } from './i18n';

export const {
  VALUE_LINE, problemStats, capabilities, calculator, benefits, testimonials, steps, comparison,
  features, consolePanels, homeFaq, hero, capabilityStrip, problem, knifeHead, solution, socialProof,
  howItWorks, comparisonHead, featuresHead, faqHead, finalCta, valuePanel, valueCases,
} = en;

/** The six capability verbs, one mono line under the console so the list from
    the old tiles isn't lost. */
export const consoleStrip = features.map((f) => f.k);
