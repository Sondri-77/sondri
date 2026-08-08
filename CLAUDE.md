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
3. **Open a PR from `derek.test` → `dev`.** That PR is the handoff point.
4. **The team owns everything after the PR.** They review, merge to `dev`, and handle `dev` → `main`.

### Rules for agents working in this repo

- Never commit to `dev`, `main`, or `derek.test` directly. Code changes land on `derek.dev` only.
- `derek.test` is updated exclusively by merging `derek.dev` into it — no cherry-picked edits, no fixups.
- Never open a PR into `main`. PRs always target `dev`, always from `derek.test`.
- Never merge a PR into `dev` — that is the team's call.
- If you're on the wrong branch, stop and switch to `derek.dev` before making changes.
- Keep `derek.dev` current with the team by rebasing/merging `origin/dev` into it, not the other way around.
