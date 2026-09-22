# CLAUDE.md — Sondri

## Branch Workflow (non-negotiable)

This repo has a shared team branch (`dev`) and my personal pair of branches.

| Branch | Role |
|---|---|
| `derek.dev` | **The only branch I write code on.** All work, commits, and experiments happen here. |
| `derek.test` | **Integration/staging branch.** Receives finished work from `derek.dev`. No direct edits. |
| `dev` | Team branch. Only ever updated via PR from `derek.test`. |
| `main` | Team release branch. Never touched from my branches. |

### The flow

```
derek.dev  ──(merge/push)──►  derek.test  ──(PR)──►  dev  ──(team)──►  main
```

1. **Build in `derek.dev`.** Branch off `derek.dev` is unnecessary — commit directly to it.
2. **Promote to `derek.test`** once work is complete and green:
   ```bash
   git checkout derek.test
   git merge derek.dev
   git push origin derek.test
   ```
3. **Open a PR from `derek.test` → `dev`, assigned to `zeeshan1112`.** That PR is the handoff point.
   ```bash
   gh pr create --base dev --head derek.test --assignee zeeshan1112
   ```
4. **The team owns everything after the PR.** They review, merge to `dev`, and handle `dev` → `main`.

### Rules for agents working in this repo

- Never commit to `dev`, `main`, or `derek.test` directly. Code changes land on `derek.dev` only.
- `derek.test` is updated exclusively by merging `derek.dev` into it — no cherry-picked edits, no fixups.
- Never open a PR into `main`. PRs always target `dev`, always from `derek.test`.
- Every PR into `dev` must be assigned to **`zeeshan1112`** (Zeeshan). No unassigned PRs.
- Never merge a PR into `dev` — that is the team's call.
- If you're on the wrong branch, stop and switch to `derek.dev` before making changes.
- Keep `derek.dev` current with the team by rebasing/merging `origin/dev` into it, not the other way around.

## Two machines, one branch

- `derek.dev` is the only edited branch in the `sondri` checkout on both Macs.
- Before leaving a machine, commit (WIP commits are fine) and push.
- On arriving, run `git pull --ff-only`.
- Never stash across machines.
- Design worktrees `sondri-new-design` and `sondri-old-design` use their own branches: `derek.new-design` and `derek.old-design`, respectively.
- Both design worktrees follow the same commit-and-push-before-leaving / `git pull --ff-only`-on-arrival rule.
- `bun.lock` is the tracked lockfile; `package-lock.json` is ignored.

## Project folders

- Never create a new project folder in an inferred location — ask the captain first with a proposed path. Never put project folders in shared OneDrive libraries. (captain, 2026-09-22)

## UI and computer-use hours

Captain rule, 2026-09-22: no UI or computer-use work 06:00-18:00 daily - no driving the captain's browser or apps (cmux-cua, codex computer use, scraping through his logged-in tabs), no UI test runs, no screenshot or visual checks. Queue those for 18:00-06:00. Code, public-web research and headless non-visual checks are fine anytime. Exceptions: the captain explicitly says so, or mid-task you ask him 'this requires computer use - now or defer?' and he answers now.
