# Sondri (web) — Decisions Log

Running record of design decisions, definitions, and open edge cases. Captures the things that
aren't neatly expressible as code.

Status key: **DECIDED** = settled, build to it. **OPEN** = still needs a call.
**DEFERRED** = deliberately postponed, revisit when we hit it.

---

## Entry template

> The point of this file is the **options not taken**. Six months from now the choice will look
> obvious and the alternatives will be invisible — that's what makes a decision impossible to
> revisit intelligently. Write down what you rejected and why, and a later you (or agent) can
> tell a settled decision from a stale one.
>
> Revisiting a decision does NOT mean editing the entry. Add a new one at the top that
> supersedes it, and mark the old one inline **and in the index**. Mark it in both places or the
> index starts lying.

**Newest first.** A new entry goes at the **top of `## DECIDED`**, directly under that heading —
which is where `/decide` appends. Two things the skill does not do for you:

1. **Take the next number.** The next entry is **D1**. Numbers are permanent — code and docs
   cite decisions by number, so **never renumber**.
2. **Add a row to the `## Index` table**, in the same commit.

```markdown
### D<n> — <the question, answered in a sentence>

**Choice:** <what was decided, stated flatly>

**Why:** <the reasoning — what made this the right call here, not in general>

**Options not taken:**
- **<alternative>** — <what was attractive about it, and why it lost>
- **<alternative>** — <same>

**Supersedes:** D<n> (omit if nothing)
```

---

## Index

4 decisions. Superseded ones are kept — the reasoning is often still useful — but marked here
and inline. **Read the marked ones with their replacement, never alone.**

| # | Decision | Status |
|---|---|---|
| D4 | Home copy = the reviewed workbench home-edgy (banned-copy rounds 1+2, voice rule) - approved | DECIDED |
| D3 | Only brutal (:4330) is worked on; brutal-v2 and the copy workbench are frozen references | DECIDED |
| D2 | Home copy = the edgy voice (workbench home-edgy, round-2 picks), approved for now | DECIDED (wording superseded by D4) |
| D1 | Home page structure = the locked 12-section sequence | DECIDED |

---

## DECIDED

### D4 — Which copy goes live on the working site after the banned-copy review?

**Choice:** The workbench `home-edgy` page as it stands after banned-copy rounds 1 and 2 (commits 5d3f27b, b514abd) plus the captain's 21:50/21:55 tweaks (hero H1 "Fix expensive bullshit. (Use AI where it helps)", Problem closer `How long has your fix been "in pilot"?`) is approved and ported verbatim onto :4330. Approved by the captain 2026-09-18 22:03 ("the before/after copy review was amazing").

**Why:** The review pass applied the captain's 12 banned patterns, the slop test and the blue-collar second-person voice rule with a before → after → rule changelog (`/copy-review/`), which the captain read and accepted.

**Options not taken:**
- **Keep :4330 on the pre-review edgy copy (D2 as shipped)** — carried lines that break the rules list.
- **Port only the flagged/changed lines** — piecemeal; the whole page is the reviewed unit.

**Supersedes:** D2 for the exact wording (D2's voice choice stands).

### D3 — Which design study is the working site?

**Choice:** Only `sondri-brutal/` (:4330) is worked on from 2026-09-18 21:02. `sondri-brutal-v2/` (:4331, at commit 845e204) is a frozen reference - not edited, not retuned. `copy-workbench/` (:4350) is not a design: it stays the live copy tool (copy edits, rules, review pages happen there) and :4330 receives copy only after the captain approves it in the workbench. All pending hero tweaks and the performance work apply to :4330 only.

**Why:** Two parallel studies were doubling every tweak; brutal now carries v2's treatment (hero, dither, gradient map, pixel tail) plus its own layout language and gold accent, so it is the superset.

**Options not taken:**
- **Keep both studies in step** — every captain tweak cost two crews; no longer worth it.
- **Make brutal-v2 the working site** — it lacks brutal's layout language and gold accent that the captain kept.

### D2 — Which copy voice does the home page use?

**Choice:** The edgy voice - the workbench `home-edgy` page with the captain's round-2 heading picks (commit 96e3121), verbatim into :4330 - approved "for now". Logo strip replaced by the capability scroll; the money-moves value line lives in the footer.

**Why:** The captain reviewed three versions in the workbench (current, alt draft, edgy) and picked the edgy headings section by section.

**Options not taken:**
- **Current-site copy (`home-alt`)** — safe, but the captain wanted the brazen voice; kept as a reference page.
- **Blend of alt body + edgy headings** — not chosen; edgy page goes over as a whole.

**Supersedes:** nothing (D1 structure still applies; the logo-strip slot now holds the capability scroll).

### D1 — What is the section structure of the Sondri home page?

**Choice:** Twelve sections, in this order, locked by the captain on 2026-09-18: Hero · Logo strip · Problem · Twist the knife · Solution & benefits · Social proof · How it works · Competitor comparison · Features · Why Sondri exists · FAQ · Final CTA. Reference draft: `copy-workbench/src/pages/home-alt.astro` (:4350/home-alt/). Future copy work targets this structure; no reshuffling without the captain.

**Why:** Blends the 10-section framework from the reference video (see `docs/comparison-sections.html`) with the sections the current site already does well (0→1→n, "Why Sondri exists"), plus a deliberate "Twist the knife" cost-of-inaction section after Problem.

**Options not taken:**
- **Strict 10 sections from the video** — dropped the site's own strong sections; captain wanted a blend.
- **13 sections with a separate "Describe the problem"** — redundant with Problem, which already carries the symptoms (addendum 2, 2026-09-18).
- **Keep the current site's order as-is** — scored 55/100 against the framework; missing proof strip, social proof, comparison.


---

## DEFERRED

---

## OPEN

*Edge cases named but not yet settled. A question that blocks the next slice belongs in
`MANIFEST.md` → `## Open Questions`, not here.*
