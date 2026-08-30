/**
 * Candidate display faces for the Sondri wordmark and headings.
 *
 * Web files:  /public/fonts/<slug>.woff2  (declared in src/styles/pixel-fonts.css)
 * Originals:  /design-system/fonts-source/  (OTF/TTF, licence files included)
 *
 * Try them live at /styleguide. To ship one, point --font-display at its
 * `family` in src/styles/theme.css.
 */

export type FontGroupId = 'pixel' | 'tech';

export interface DisplayFont {
  /** CSS font-family name, as declared in pixel-fonts.css */
  family: string;
  /** Label shown in the styleguide switcher */
  name: string;
  group: FontGroupId;
  /** On the current shortlist — the faces still in contention for the wordmark. */
  shortlist?: boolean;
}

export const fontGroups: { id: FontGroupId; label: string }[] = [
  { id: 'pixel', label: 'Pixel' },
  { id: 'tech', label: 'Futuristic / display' },
];

export const displayFonts: DisplayFont[] = [
  { family: 'Bit Game', name: 'Bit Game', group: 'pixel' },
  { shortlist: true, family: 'Bitram', name: 'Bitram', group: 'pixel' },
  { family: 'Clexon Pixel', name: 'Clexon Pixel', group: 'pixel' },
  { family: 'CS Foster', name: 'CS Foster', group: 'pixel' },
  { shortlist: true, family: 'Florexa', name: 'Florexa (pixel serif)', group: 'pixel' },
  { shortlist: true, family: 'Matrixel', name: 'Matrixel', group: 'pixel' },
  { family: 'Orpix', name: 'Orpix', group: 'pixel' },
  { family: 'Pixel Bots', name: 'Pixel Bots', group: 'pixel' },
  { family: 'Pixel Machine', name: 'Pixel Machine', group: 'pixel' },
  { family: 'Pixel Quest', name: 'Pixel Quest', group: 'pixel' },
  { family: 'Pixel Space', name: 'Pixel Space', group: 'pixel' },
  { family: 'Porca', name: 'Porca (rounded)', group: 'pixel' },
  { family: 'Porca Outline', name: 'Porca Outline', group: 'pixel' },
  { family: 'Sanspix', name: 'Sanspix', group: 'pixel' },
  { family: 'Signal Pixel', name: 'Signal Pixel', group: 'pixel' },
  { family: 'Signal Pixel Outline', name: 'Signal Pixel Outline', group: 'pixel' },
  { family: 'Sitewalk', name: 'Sitewalk', group: 'pixel' },
  { family: 'Galabix', name: 'Galabix', group: 'pixel' },

  { family: 'Digibra', name: 'Digibra', group: 'tech' },
  { family: 'Hexora', name: 'Hexora', group: 'tech' },
  { family: 'Lakonet', name: 'Lakonet', group: 'tech' },
  { family: 'Maveric', name: 'Maveric', group: 'tech' },
  { family: 'Necosmic', name: 'Necosmic', group: 'tech' },
  { family: 'Neuroxa', name: 'Neuroxa', group: 'tech' },
  { family: 'Universa', name: 'Universa', group: 'tech' },
];

/** The faces still in contention. Everything else is kept for reference. */
export const shortlist = displayFonts.filter((f) => f.shortlist);
