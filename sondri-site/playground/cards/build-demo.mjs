import { readFile, writeFile } from 'node:fs/promises';
const here = new URL('./', import.meta.url);
const cards = JSON.parse(await readFile(new URL('index.json', here), 'utf8'));
const fragments = await Promise.all(cards.map(card => readFile(new URL(card.file, here), 'utf8')));
await writeFile(new URL('demo.html', here), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sondri · Solution cards</title>
<style>
body { margin: 0; padding: 24px; background: #081f1f; color: #e9edec; }
h1 { margin: 0 0 24px; font: 11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; font-weight: 400; }
main { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
@media (max-width: 1099px) { main { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 699px) { main { grid-template-columns: minmax(0, 1fr); } }
</style>
</head>
<body>
<h1>/ PLAYGROUND · PART A · SOLUTION CARDS</h1>
<main>${fragments.join('\n')}</main>
</body>
</html>\n`);
console.log('Inlined all nine fragments into demo.html');
