# Claude To A Tee QA

Last updated: 2026-06-30

## Purpose

This file defines what the user means by "to a tee" for Claude Design work and
how to verify it before commit or deploy.

Use this together with `claude-design-index.md` for finding source files and
`PROJECT_STRUCTURE_GUIDE.md` for finding implementation files.

## Trigger Phrase

When the user says "to a tee" about Claude Design, expand it internally to:

```text
CLAUDE TO A TEE AUDIT. Implement from the offline Claude HTML exactly at component level, mobile included, and verify before commit/deploy.
```

This is not a loose visual polish request. It means component-level fidelity.

## Source Of Truth Order

1. The newest explicit user requirement in the current chat.
2. The supplied offline Claude HTML/CSS/assets for the requested surface.
3. Existing live behavior, data contracts, Firebase rules, tests, and i18n.
4. Older handoff/recovery docs.

If Claude conflicts with a newer user requirement, preserve the newer user
requirement and document the divergence.

## Required Audit Flow

1. Identify the exact Claude offline file(s) for the surface.
2. Read the relevant HTML/CSS/JS deeply enough to understand component structure.
3. Compare live DOM/CSS structure against the Claude component, not just colors.
4. Patch the smallest surface that can faithfully match the design.
5. Verify desktop, tablet, and mobile when the component can render responsively.
6. Run the test level required by `PLAYBOOK.md`.
7. Before commit/deploy, re-check the specific components named by the user.

## Component Checklist

Check these values against the Claude source or screenshot:

- Layout: grid/flex direction, column count, alignment, wrapping, and gaps.
- Size: width, height, min/max constraints, aspect ratio, fixed controls.
- Spacing: padding, margin, row gap, column gap, section rhythm.
- Typography: font family, size, weight, line height, letter spacing.
- Borders: radius, border width, border color, dashed vs solid treatment.
- Color: background, foreground, muted text, active/inactive states.
- Icon placement: icon size, center alignment, baseline, and label spacing.
- Controls: button/pill height, tap target, selected state, disabled state.
- Inputs: height, vertical centering, placeholder copy, focus ring, overflow.
- Overlays: modal width, title/subcopy hierarchy, buttons, close alignment.
- Animation/loading: first-load eye size, motion timing, nonblocking state.
- Assets: exact portrait/icon/image source, crop, transparency, and scale.
- Mobile overrides: iPhone SE, iPhone, iPhone Pro, iPhone Pro Max, tablet.

## Known Party Ledger Fidelity Locks

These are regressions that happened before and must stay locked:

- Quest-row close button is a compact 22px circle with the `x` centered.
- `Attach receipt` is the small dashed Claude-style button, not a large block.
- `Whole party` is a compact dashed pill, not a touch-expanded oversized button.
- Split segments keep balanced Claude proportions; no lopsided long tab.
- Add-by-Character-ID and Add Guest fields must not be vertically bloated.
- Loading eye remains small when Claude uses the smaller loading treatment.
- Phone widths must not introduce horizontal page overflow.

## Mobile QA Matrix

When a Claude-to-a-tee change touches responsive UI, verify at least:

| Target | Width | Primary browser intent |
| --- | ---: | --- |
| iPhone SE | 375px | Safari/Chrome compact phone layout |
| iPhone | 390px or 393px | common iPhone width |
| iPhone Pro | 402px or 414px | modern iPhone layout |
| iPhone Pro Max | 430px | wide iPhone layout |
| Tablet | 820px | touch/tablet tier without phone shell unless specified |
| Desktop | 1280px+ | full desktop layout |

Android is secondary but still important. When time allows, include one
Chrome-like Android viewport around `412 x 915`.

## Visual Failure Patterns To Hunt

- Inputs or tabs that became taller than Claude because of inherited touch CSS.
- Buttons whose text is visually centered but icon is not.
- Wide labels causing unbalanced segmented controls.
- Mobile-only overflow caused by fixed desktop widths.
- Placeholder text using real user examples such as `pointy` instead of neutral
  professional login/signup copy.
- Hidden hover controls on touch devices.
- New UI strings added in one language only.
- A cosmetic patch that changes selectors used by delegated events or tests.

## Evidence Before Commit Or Deploy

For a production-level Claude-to-a-tee task, capture or report:

- Which Claude source file(s) were compared.
- Which route(s) and component(s) were checked.
- Which viewport set was checked.
- Which tests ran.
- Any intentional divergence from Claude because of newer user requirements.

Do not commit/deploy a Claude-to-a-tee change after only a broad screenshot
glance when the request is about component-level fidelity.

