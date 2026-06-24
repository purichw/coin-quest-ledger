# Leveling Canon

Last updated: 2026-06-22

Status: v1 current implementation canon. Profile Renown has been reframed as Profile Reputation: a positive-only, credit-bureau-inspired trust signal. Scores can be earned but are not deducted.

## Source Of Truth

All level math must start in `shared/pointy-logic.js`.

- `PointyLogic.CHARACTER_LEVEL_THRESHOLDS`
- `PointyLogic.REPUTATION_LEVEL_THRESHOLDS`
- `PointyLogic.levelFromXp(xp)` is the character-level helper.
- `PointyLogic.levelFromReputation(reputation)` is the account/profile-level helper.
- `PointyLogic.levelFromRenown(renown)` remains a compatibility alias only.
- `PointyLogic.rewardFor(lvl)` maps level milestones to title/frame rewards.

Do not add new `Math.floor(x / step) + 1` formulas in feature files. Add a helper to `PointyLogic` first, then call it from modules.

Native app note: `mobile/src/gameLogic.ts` currently mirrors only the module-specific native gameplay math needed for Debt Dragon, Treasury, and Compare. It must not invent separate XP/level thresholds. When native surfaces display character/profile levels, port or share the `PointyLogic` canon instead of adding mobile-only formulas.

## Tracks

### Character XP

Character XP belongs to a character, not to a user account. It powers Party Ledger hero cards, Debt Dragon slayer cards, and Character Profile.

Current total XP thresholds:

| Level | Total XP Required |
| ---: | ---: |
| 1 | 0 |
| 2 | 300 |
| 3 | 800 |
| 4 | 1,500 |
| 5 | 2,500 |
| 6 | 4,000 |
| 7 | 6,000 |
| 8 | 8,500 |
| 9 | 12,000 |
| 10 | 16,000 |

There is no max level in v1.

After level 10, the current fallback adds 5,000 XP per level.

### Profile Reputation

Profile Reputation belongs to the active account/profile. It is the broad financial reliability score shown in shared profile surfaces.

It is positive-only. Late settlement, overspending, or missed debt activity does not subtract score; those moments simply do not earn the positive bonuses.

Current total Reputation thresholds:

| Level | Total Reputation Required |
| ---: | ---: |
| 1 | 0 |
| 2 | 1,000 |
| 3 | 2,500 |
| 4 | 5,000 |
| 5 | 9,000 |
| 6 | 15,000 |
| 7 | 23,000 |
| 8 | 34,000 |
| 9 | 48,000 |
| 10 | 65,000 |

After level 10, the current fallback adds 20,000 Reputation per level.

### Treasury Reputation

Treasury contributes to Profile Reputation. It is not Character XP.

Current values:

| Activity | Reputation |
| --- | ---: |
| Log expense day | 10 |
| Pay a bill on time | 80 |
| Close an under-budget month | 500 |

## Activity Rewards

### Party Ledger

Party Ledger gives Character XP and Profile Reputation, but the tracks no longer scale directly with the amount of money.

| Activity | Character XP | Profile Reputation |
| --- | ---: | ---: |
| Front money above own share | amount / 20, capped 250 per board | amount / 50, capped 100 per campaign |
| Confirm settlement as payer | 180 | fully settled board bonus below |
| Confirm settlement as payee | 120 | fully settled board bonus below |
| Add valid expense/quest | 0 direct Character XP | 10 each, capped 50 per campaign |
| Fully settled board/campaign | 0 direct Character XP | 250 |
| Fully settled multi-member board/campaign | 0 direct Character XP | +100 |

Notes:

- Character XP from a trip is stored per character and per trip where possible.
- `characters/{id}.xp` is preferred when available.
- If `characters/{id}.xp` is missing, Character Profile can derive XP from trip records, debt XP, scaled fronted-money XP, and settlement XP.

### Debt Dragon

Debt Dragon gives Character XP to the slayer track and contributes to Profile Reputation.

| Activity | Character XP | Profile Reputation |
| --- | ---: | ---: |
| Logged debt damage/payment | amount / 10 | amount / 10, capped 300 per payment |
| Slay/close a debt dragon | 500 | 600 |

### Price Comparison

Price Comparison currently contributes only to Profile Reputation.

| Activity | Reputation |
| --- | ---: |
| Run a comparison with 2+ offers | 80 |
| Add meaningful offers | 10 each, capped 40 per comparison |

## Rewards

Reward title/frame milestones are shared by Character XP and Profile Reputation displays:

| Minimum Level | Frame | Title TH | Title EN |
| ---: | --- | --- | --- |
| 1 | novice | มือใหม่ | Novice |
| 2 | bronze | น่าเชื่อถือ | Trusted |
| 4 | silver | ใจบุญ | Generous |
| 6 | gold | ผู้กล้า | Champion |
| 9 | legend | ตำนาน | Legend |

These titles are current implementation labels, not final game-balance labels.

## Admin Portal Rule

Admin Portal must display canonical levels using `PointyLogic` helpers.

- Character rows use `PointyLogic.levelFromXp`.
- Overall/user rows use `PointyLogic.levelFromReputation`.
- The current Admin `userReputation` calculation is a local diagnostic proxy until real account data exists. It must not become a separate product-level formula.

## Recalibration Backlog

Do not recalibrate in this canon pass. Later we can decide:

- Whether Character XP and Profile Reputation curves should get steeper after level 10.
- Whether over-share currency should be capped more strictly for very large trips.
- Whether settlement payer/payee bonuses should vary by settlement speed.
- Whether quest logging and campaign completion should grant Character XP, Profile Reputation, or both.
- Whether Debt Dragon rewards should be capped by month or dragon.
- Whether profile titles should diverge from character titles.
- Whether progress percent should floor instead of round near 100%.
