// Inline the nine card fragments into ../index.html between the <!-- cards --> markers.
// Run from anywhere: node sondri-site/playground/cards/assemble.mjs
import { readFile, writeFile } from 'node:fs/promises';
const here = new URL('./', import.meta.url);
const target = new URL('../index.html', here);
const cards = JSON.parse(await readFile(new URL('index.json', here), 'utf8'));
const fragments = await Promise.all(cards.map(card => readFile(new URL(card.file, here), 'utf8')));
const page = await readFile(target, 'utf8');
const open = '<!-- cards -->', close = '<!-- /cards -->';
const start = page.indexOf(open), end = page.indexOf(close);
if (start < 0) throw new Error('index.html has no <!-- cards --> marker');
const before = page.slice(0, start + open.length);
const after = end < 0 ? page.slice(start + open.length) : page.slice(end);
await writeFile(target, `${before}\n${fragments.map(f => f.trim()).join('\n')}\n${end < 0 ? close : ''}${after}`);
console.log(`Inlined ${cards.length} cards into index.html`);
