/** Flattens a `Copy` into the dotted keys the toggle swaps by
    (`hero.lede`, `valueCases.0.before.2.t`, …), plus the derived pieces the
    components render separately: the accent full stop every heading ends
    on (`*.h2.text` / `*.h2.dot`), the hero's two lines, the Problem
    closer's quoted phrase, the footer line. Shared by the server (to embed
    both dictionaries) and the client (which only reads them). */
import type { Copy } from '../i18n';
import { splitDot } from './dot';

export type Dict = Record<string, string>;

const HEADS = ['problem', 'knifeHead', 'solution', 'socialProof', 'howItWorks', 'comparisonHead', 'featuresHead', 'faqHead', 'finalCta'] as const;

/** Straight quotes set as curly ones, and the quoted phrase never breaks. */
export const splitQuote = (s: string): [string, string] => {
  const [head, tail = ''] = s.replace(/"([^"]+)"/, '“$1”').split(/(?=“)/);
  return [head, tail];
};

/** The H1 sets as two lines: the claim, then the parenthetical. */
export const splitHero = (h1: string): [string, string, string] => {
  const [line1, line2 = ''] = h1.split(/ (?=\()/);
  const [text, dot] = splitDot(line1);
  return [text, dot, line2];
};

export function flatten(copy: Copy): Dict {
  const d: Dict = {};
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'string') d[path] = v;
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}.${i}`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(copy, '');

  for (const k of HEADS) {
    const [text, dot] = splitDot(copy[k].h2);
    d[`${k}.h2.text`] = text;
    d[`${k}.h2.dot`] = dot;
  }
  const [h1, h1dot, h1paren] = splitHero(copy.hero.h1);
  d['hero.h1.text'] = h1;
  d['hero.h1.dot'] = h1dot;
  d['hero.h1.paren'] = h1paren;
  const [closeHead, closeTail] = splitQuote(copy.problem.close);
  d['problem.close.head'] = closeHead;
  d['problem.close.tail'] = closeTail;
  const [line, lineDot] = splitDot(copy.VALUE_LINE);
  d['VALUE_LINE.text'] = line;
  d['VALUE_LINE.dot'] = lineDot;
  const [nf, nfDot] = splitDot(copy.notFound.h1);
  d['notFound.h1.text'] = nf;
  d['notFound.h1.dot'] = nfDot;
  copy.framework.forEach((p, i) => {
    d[`framework.${i}.phase`] = `${copy.howItWorks.phase} ${p.num}`;
  });
  return d;
}
