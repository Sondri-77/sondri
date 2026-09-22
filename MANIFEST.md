# MANIFEST

> The single working document for this project. Vision, current reality, and what's still
> undecided. `/chart` writes it, `/decide` advances it, `/reconcile` keeps it honest.
> Decisions live in [decisions.md](./decisions.md).

**Last charted:** `<date>` · **Status:** `<one line — what this project is ready to do right now>`
**Last updated:** `<date>` — `<what changed>`

Decisions: **0** · Open questions: **0**

---

## Key context

*Links a fresh session must read before doing anything, each with one line saying why. Keep it
short — three to five entries. If everything is key context, none of it is.*

- `<path>` — `<why it matters>`
- **[decisions.md](./decisions.md)** — the decision log, newest first, with a status index.
  Superseded entries are kept and marked; never read a marked one without its replacement.

---

## Context

*Reference material: what this is, the domain model, how the code is laid out. This changes
rarely, and it is **not state** — `## Current State` is. Anything here that could go stale
without anyone noticing belongs in Current State instead.*

### What this is

`<a paragraph a newcomer could read and understand the point of the project>`

**Does:** `<…>`
**Does not:** `<the boundaries that keep getting re-litigated — write them here once>`

### The model

`<the domain vocabulary and its rules. Define terms that mean something specific here,
especially ones that mean something *else* elsewhere.>`

### Code architecture

`<layout, the dependency rule, where the invariants live>`

### Running it

`<setup, run, test — the exact commands, copy-pasteable>`

---

## Destination

*Written by `/chart` step 1. What "done enough to be real" looks like for **this bounded
effort** — not for the product forever. If this reads like "build V1", it is too big; carve out
the first chunk.*

`<the destination, in a paragraph>`

**Done enough to be real:** `<the concrete test — what you can do, and see, when this is done>`

Explicitly **not** part of this destination: `<the things that are real but come after. Listing
them here is what keeps the destination from quietly growing.>`

---

## Ideal State

*If each dimension were going great, what would be true? Pick 3-6 dimensions that matter for
**this** project. Suggested starting set, to adapt rather than adopt: **Experience**,
**Data & Domain**, **Surface**, **Operations**, **Constraints**.*

*Specifics beat adjectives: "cold start under 200ms, no config file" beats "fast and simple".
Write `TBD` where the answer genuinely isn't known — never invent a target to fill a hole. Every
`TBD` is a candidate for `## Fog`.*

### `<Dimension>`

- `<what would be true>`
- `<what would be true>`
- TBD — `<the thing not yet known>`

### `<Dimension>`

- `<…>`

---

## Current State

*The same dimensions, mirrored. Every row is `status: have | partial | missing`. On greenfield
most rows are `missing` — correct and expected, not a failure.*

*`/reconcile` verifies these **against the code**. Never edit a row from what the last session
claimed it did.*

### `<Dimension>`

- `<capability>` — status: missing
- `<capability>` — status: partial. `<what exists, and what's still absent>`

---

## Open Questions

*Sharp enough to state as a question, **and** blocking the next slice. Keep this to 3-6 — if the
list runs long, most of it is fog being pre-sliced; push it back into `## Fog`.*

*Tags: `[talk]` settle by discussion · `[proto]` build the cheapest reactable thing ·
`[research]` fire a subagent · `[task]` manual work that unblocks a decision.*

*These read as **questions**. Anything that reads "build the X" belongs in `## Roadmap`.*

- [ ] **[talk] O1 — `<the question>`** `<why it blocks the next slice, and what turns on the answer>`
- [ ] **[proto] O2 — `<the question>`** `<…>`

---

## Fog

*Things you can sense but not yet state precisely. The test is whether you can **state** it now,
not whether you can **answer** it now.*

*When a patch of fog sharpens into a question, move it to `## Open Questions` and **delete it
here** — never both places.*

- `<the shape of a problem you can feel coming>`

---

## Out of Scope

*Settled non-goals. Each with the reason or the decision that put it here, so it doesn't get
re-argued every few sessions.*

- **`<thing>`** — `<why not, or D<n>>`

---

## Roadmap

*Only what is unambiguous enough to build **right now**, in order. Usually short. It grows as
questions close.*

1. **`<slice>`** — `<what shipping it means>`
2. **`<slice>`** — `<…>`

**Held** — *work that is real but parked behind the current destination. Kept so it isn't
rediscovered later as if it were new.*

- `<…>`
