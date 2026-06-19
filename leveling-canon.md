# Leveling Canon

Status: v0 current implementation canon. This file freezes names, tracks, and source-of-truth helpers before any reward recalibration.

## Source Of Truth

All level math must start in `shared/pointy-logic.js`.

- `PointyLogic.CHARACTER_LEVEL_STEP = 600`
- `PointyLogic.RENOWN_LEVEL_STEP = 1200`
- `PointyLogic.levelFromXp(xp)` is the character-level helper.
- `PointyLogic.levelFromRenown(renown)` is the account/profile-level helper.
- `PointyLogic.rewardFor(lvl)` maps level milestones to title/frame rewards.

Do not add new `Math.floor(x / step) + 1` formulas in feature files. Add a helper to `PointyLogic` first, then call it from modules.

## Tracks

### Character XP

Character XP belongs to a character, not to a user account. It powers Party Ledger hero cards, Debt Dragon slayer cards, and Character Profile.

Current level curve:

```txt
level = floor(characterXp / 600) + 1
```

Examples:

| Level | XP Range |
| --- | --- |
| 1 | 0-599 |
| 2 | 600-1199 |
| 3 | 1200-1799 |
| 4 | 1800-2399 |
| 5 | 2400-2999 |
| 6 | 3000-3599 |
| 9 | 4800-5399 |

There is no max level in v0.

### Profile Renown

Profile Renown belongs to the active account/profile. It is the broad "overall level" shown in shared profile surfaces.

Current level curve:

```txt
overallLevel = floor(renown / 1200) + 1
```

Examples:

| Level | Renown Range |
| --- | --- |
| 1 | 0-1199 |
| 2 | 1200-2399 |
| 3 | 2400-3599 |
| 4 | 3600-4799 |
| 5 | 4800-5999 |
| 10 | 10800-11999 |

There is no max overall level in v0.

### Treasury XP

Treasury XP is a module contribution to Profile Renown. It is not Character XP.

Current values:

| Activity | Renown |
| --- | ---: |
| Log a treasury expense | 8 |
| Pay a bill on time | 60 |
| Close an under-budget month | 800 |

## Activity Rewards

### Party Ledger

Party Ledger gives Character XP and Profile Renown through the same underlying actions, but the track names matter.

| Activity | Character XP | Profile Renown |
| --- | ---: | ---: |
| Front money above own share | 1 XP per 1 over-share currency unit | Same fronted amount |
| Confirm settlement as payer | 400 | 400 |
| Confirm settlement as payee | 200 | 200 |
| Add an expense/quest | 0 direct Character XP | 60 |
| Mark a campaign completed | 0 direct Character XP | 400 |

Notes:

- Character XP from a trip is stored per character and per trip where possible.
- `characters/{id}.xp` is preferred when available.
- If `characters/{id}.xp` is missing, Character Profile can derive XP from trip records, debt XP, fronted amount, and settlement XP.

### Debt Dragon

Debt Dragon gives Character XP to the slayer track and contributes to Profile Renown.

| Activity | Character XP / Renown |
| --- | ---: |
| Logged debt damage/payment | amount / 10 |
| Slay/close a debt dragon | 500 |

### Price Comparison

Price Comparison currently contributes only to Profile Renown.

| Activity | Renown |
| --- | ---: |
| Run a comparison with 2+ offers | 120 |

## Rewards

Reward title/frame milestones are shared by Character XP and Profile Renown displays:

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
- Overall/user rows use `PointyLogic.levelFromRenown`.
- The current Admin `userRenown` calculation is a local diagnostic proxy until real account data exists. It must not become a separate product-level formula.

## Recalibration Backlog

Do not recalibrate in this canon pass. Later we can decide:

- Whether Character XP should be linear forever or use a curve.
- Whether over-share currency should be scaled down for large trips.
- Whether settlement payer/payee bonuses should be smaller or capped.
- Whether quest logging and campaign completion should grant Character XP, Profile Renown, or both.
- Whether Debt Dragon rewards should be capped by month or dragon.
- Whether profile titles should diverge from character titles.
- Whether progress percent should floor instead of round near 100%.
