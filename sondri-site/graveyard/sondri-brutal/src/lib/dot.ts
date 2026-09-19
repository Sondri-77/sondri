/** Brutal sets the full stop of a headline in the accent (`.gdot`). Split it
    off so the copy string stays verbatim and only the mark is styled. */
export const splitDot = (s: string): [string, string] =>
  s.endsWith('.') ? [s.slice(0, -1), '.'] : [s, ''];
