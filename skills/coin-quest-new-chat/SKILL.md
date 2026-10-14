---
name: coin-quest-new-chat
description: Onboard or refresh context for Coin Quest Ledger. Use for a new-chat prompt, project handoff, required reading/setup, or documentation and context pickup before web, native mobile, shared Firebase, ledger, Admin, QA or release work.
---

# Coin Quest New Chat

Prepare a fresh Codex chat to work on Coin Quest Ledger from current files,
without depending on old conversation memory. This is an onboarding router,
not authorization to start another chat or publish changes.

## Workflow

1. Use the current task's Coin Quest checkout/worktree. The primary fallback is
   `/Users/point/toolbox`; do not leave a selected checkout merely to use it.
2. Run `git status --short --branch` in that checkout before edits. Preserve
   uncommitted work and distinguish local source, pushed source and production.
3. Read the shared starter shape at
   `/Users/point/.codex/skills/project-onboarding/references/new-chat-template.md`.
4. Read [references/new-chat-context.md](references/new-chat-context.md), then
   the current checkpoint in `Memory.md`, `PLAYBOOK.md` start-of-work guidance
   and task-relevant entries in `PROJECT_STRUCTURE_GUIDE.md`.
5. Follow the reference's task map to the smallest relevant docs/source set.
   Keep dated QA/release evidence distinct from current runtime verification.
6. For a starter request, return a copy-ready prompt using the selected checkout
   and the reference template. For a concrete task, briefly summarize context
   and proceed. If no task is supplied, finish onboarding and wait for direction.

## Required Discipline

- Stay in the current chat. Preparing a handoff does not authorize inspecting,
  creating, monitoring or messaging another chat, including DOOTAA.
- Read named skills from disk. Keep production SHA, release state and test
  counts in living project docs, not cached claims in this skill.
- Do not commit, push, deploy, rollback, revert, remove, migrate or mutate
  production records without authorization for that scope in the current task.
  Historical release notes and old user approvals do not authorize a new action.
- Website and native share Firebase identity, ledger and finance contracts.
  Preserve storage keys, ownership, one-account/one-active-character identity,
  pairwise settlements, XP/Reputation separation and explicit sync/conflicts.
  Read domain docs before changing those contracts; never substitute static
  finance data or treat browser fixtures as live account proof.
- Native is a player-only Expo app, not a WebView or native Admin. Read
  `mobile/AGENTS.md`, `mobile/README.md` and `mobile/IOS_BUILD_NOTES.md` for native
  work. Accept affected flows only with the own binary on an actual Simulator;
  Expo Go, JS exports and phone browser viewports are different evidence.
- Read current visual direction in `Memory.md`, `PLAYER_DESIGN_SYSTEM.md` and
  `mobile/DESIGN_DIRECTION.md`. Player website screens follow the latest supplied
  mockups and shared design contract; native and Admin retain their own direction.
  Living docs take precedence over historical restoration/release summaries. Do
  not revive retired UI or overwrite backend fixes to restore a visual reference.
- Keep player headers, footers, frames, banner scale and navigation in their
  shared owners. A new mockup is one screen in the same product. Within the same
  module, carry its visual family through entry/detail/forms and older screens
  that have not been redesigned. Different games deliberately use different
  artwork, palettes and compositions; do not force identical illustrations.
  Accommodate necessary context differences with a documented scoped variant.
  Before changing a page, inspect the shared owner and its closest module sibling.
- Scope verification to risk: docs need factual/path/diff validation, visible
  changes need current targeted browser/Simulator evidence, shared data/auth and
  releases need their contract gates. Onboarding alone needs no app build,
  fresh Simulator run, full suite or production smoke.
- For release work use `$release-gate` and the deploy runbook. Track push,
  exact-full-SHA CI, Vercel build and canonical alias promotion separately.
  Take current domain/Auth targets from that runbook and the security doc;
  historical screenshots and handoffs must not restore retired aliases.
  The GitHub workflow is the production writer; do not create a duplicate
  deployment while it runs. Web/API deploy does not publish native binary/OTA
  or Firestore Rules. For rollback-like work use `$rollback-guardrail`.
- This skill's versioned source is `skills/coin-quest-new-chat/` in the repo;
  its installed copy is `/Users/point/.codex/skills/coin-quest-new-chat/`.
  When updating the skill, keep its three files aligned and validate both copies.

## Reference

Use [references/new-chat-context.md](references/new-chat-context.md) for the
read order, owner/skill map, verification commands and starter prompt.
