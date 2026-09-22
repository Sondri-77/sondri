# Display font candidates — source files

Original vendor packages (OTF/TTF, plus any vendor-supplied web kits and readme/
licence files) for the display faces we're trialling for the Sondri wordmark and
headings. **These are not served to the browser.**

## What ships instead

Each family was converted to a single web-optimised `.woff2` and placed in
`sondri-site/public/fonts/`. 25 faces, ~630 KB total — and none of them download
unless something on the page actually uses them.

| Where | What |
|---|---|
| `sondri-site/public/fonts/*.woff2` | The served files |
| `sondri-site/src/styles/pixel-fonts.css` | `@font-face` declaration per family |
| `sondri-site/src/display-fonts.ts` | Family list + grouping for the switcher |
| `sondri-site/src/pages/styleguide.astro` | Live trial page — `/styleguide` |

## Trying one

Open `/styleguide` and use the switcher at the top. It drives the wordmark, the
H1s, and the specimen block, and remembers your pick between visits. Nothing you
do there affects the live site.

## Shipping one

One token, in `sondri-site/src/styles/theme.css`:

```css
--font-display: 'Pixel Quest';
```

The styleguide prints the exact line for whichever face you have selected.

Keep body copy on Hanken Grotesk. These are display faces — most are unreadable
below ~20px, and several have partial punctuation and no italics.

## Licensing

⚠️ These are commercial fonts. Before the site goes live with one, confirm the
vendor licence covers **web embedding** at our expected traffic — desktop-only
licences are common and do not permit `@font-face` use. Per-family readme and
licence files are inside each folder where the vendor supplied one.

## Installing them on your Mac

`rename-for-desktop.py` stages desktop copies with every family renamed to a
`Sondri ` prefix — `Sondri Pixel Quest`, `Sondri Orpix`, and so on. Typing
"Sondri" in any app's font search then surfaces the whole library at once, which
is the only filter that works everywhere (Adobe apps ignore Font Book
collections entirely).

```bash
python3 -m venv /tmp/ft && /tmp/ft/bin/pip install fonttools
/tmp/ft/bin/python rename-for-desktop.py /tmp/sondri-fonts
cp /tmp/sondri-fonts/*.otf ~/Library/Fonts/
```

The renaming touches only these desktop copies. Vendor originals in this folder
and the web build in `public/fonts` keep their real family names.
