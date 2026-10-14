# Post-deployment Admin and Party cleanup

## Baseline and scope

The latest completed release found in GitHub was
`2924f02dad60a34c3fb964cdc3497c78ad5fc535`, run
[38547534989](https://github.com/purichw/coin-quest-ledger/actions/runs/38547534989).
Its deployment log confirms canonical alias promotion at 10:26 UTC to
`coinquestledger-mvnbu3f2z-purich-w.vercel.app`. This cleanup covers subsequent
working-tree Admin and Party changes. It does not deploy or mutate live records.

## Removed or reconciled

- Admin's unused `adminCharacterId`, `statCard`, `editInput` and `quickOpen`
  helpers. Current list shortcuts, ID editing and Dashboard KPI renderer remain.
- Unreferenced Admin prototype stat/rarity/pagination/HP/diff/toast/scrim/danger
  styles and unused utility rules. The live modal, confirmation, table, progress,
  header/sidebar and Dashboard Cards/Command paths remain.
- Party's unused local PromptPay TLV/CRC implementation, trip-code sanitizer,
  old `createCampaign` path and `openOwnedBoard` wrapper. PromptPay stays with
  `PointyLogic`; new trips, history and owned-board links use their live handlers.
  The obsolete `start_campaign` translations were also removed.
- Previously retired Board/User detail tab state, Member details controls,
  inline Hero selectors and full-width floating expense summary have no remaining
  runtime references in the touched owners.
- `ADMIN.md` is now an index, removing the competing prototype specification.
  Architecture, site map, design index, project map and Memory point to current
  owners. The Firebase Admin dependency pin was retained in the security doc.
  Historical screenshots/QA remain dated evidence, not current instructions.
- Updated installed Coin Quest Admin/Ledger skills and both copies of the
  onboarding context. Generic mockup guidance already preserves product contracts
  and shared surfaces; no project-specific rules were added to that generic skill.

## Party composition

The expense log shares the desktop left column with members, eliminating the
gap caused by the taller right-side form. At ≤1000px the same DOM node follows
entry and settlement. Moving it retains filters, input values and keyboard focus.
There is one log and one state store, with no duplicated markup or placeholder
height. All member details and class-specific backgrounds remain visible; the
game-stats preference still controls HP/XP. Character ID invitations and Guest
creation are unchanged by the mockup.

## Verification

Local source: dirty working tree based on the release SHA above. Server:
`http://127.0.0.1:4569`; synthetic `?test=1` fixtures only.

- 58 Chromium cases across Admin shell, Boards, Users, Board Admins, Deleted IDs,
  Relationship Map, Board Info, User Detail, Admin flow audit, Party board and
  expanded party layout. Cases include desktop/tablet/phone widths, search,
  disclosures, links, focus, export, lifecycle confirmations, draft/save/restore,
  validation, persistence and the gap/resize regression.
- Four additional existing Party flows: explicit Hero choice/locking,
  Character ID invite/Guest separation, new-board creation, itemized expenses
  and quest-board campaign history. All passed.
- Browser/module syntax and required deployed assets passed. Skill validators
  passed for Admin, Ledger and both onboarding copies; onboarding files match.
- Personally inspected `split-party-layout-2026-10-14/qa/gap-fixed-*` at 1440,
  768 and 390px, and `admin-user-profile-2026-10-14/qa/cleanup-*` desktop/phone
  viewports. Party log spacing, complete member cards, distinct class colors,
  readable Admin parchment/title and shared shell were preserved.

No full-site, live Firebase, backend/emulator or native suite was rerun: this
pass removes unused presentation paths and changes local board composition,
not their data/auth/math contracts. Installed skills are local files outside
the Git release. No commit, push or deployment was performed.
