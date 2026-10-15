# Admin Portal Implementation

Visible labels and feedback follow [UI copy guidelines](UI_COPY_GUIDELINES.md).
Board filters use full product names; internal filter keys remain unchanged.

Last updated: 2026-10-14

## Purpose

This file documents the live `/admin/` implementation. `ADMIN.md` is a short
entry-point index, not a second specification. Fresh mockups may change visual
composition within the current auth, identity and data contracts.

## Source Files

- `admin/index.html`: static Admin shell and Firebase compat script loading.
- `admin/admin.css`: Admin feature layouts, tables, details and modal structure.
- `admin/design.css`: canonical Admin visual tokens, shared frame and responsive
  presentation. Avoid adding competing page-specific header/sidebar overrides.
- `admin/shell.js`: shared header, navigation, footer and compact-menu behavior.
- `admin/app.js`: Admin gate, data load, renderers, modals, draft/publish,
  lifecycle, reset, delete request, and support actions.
- `api/admin-delete-status.js`: privileged delete readiness endpoint.
- `api/admin-delete-user.js`: backend-only permanent delete.
- `api/admin-reset-user.js`: backend-only Super Admin password reset.
- `api/account-recovery-core.js`: shared backend account reset helpers.
- `firestore.rules`: Super Admin read/write guard for protected collections.

## Access Model

Canonical Admin URL: `https://coinquestledger.vercel.app/admin/`. Firebase Auth
authorizes this hostname; the retired web hostname was removed on 2026-10-14.
Fresh Google sign-in and real Admin reads passed after the cutover. The Firebase
project and Google OAuth helper callback remain unchanged, so the helper's
legacy project name can still appear during sign-in. The new browser origin
requires its own session and does not change the Super Admin allowlist or data.
See `docs/domain-migration-2026-10-14/README.md` for the verified release.

Production:

1. Initialize Firebase Auth.
2. Sign in through Google provider.
3. Accept only verified `purich.wc@gmail.com`.
4. Load Admin data from Firestore.

Test mode:

- `/admin/?test=1` uses a local gate and local/session fixtures for automated
  regression only. It is not security.

## Data Load

`loadPublished()`:

- loads `trips` into normalized board records with server-source Firestore reads;
- loads recent `adminRevisions` with server-source Firestore reads;
- loads `users` into cloud user records with server-source Firestore reads;
- loads reusable deleted username tombstones from `usernames` with server-source
  Firestore reads;
- initializes `draft` from local draft storage or the published board set.

Local Admin draft storage is an explicit unpublished-draft surface. It can keep
operator edits visible until Save/Restore/Publish, but it is not a live fallback.
Restore discards the draft and returns to the latest published server state.
Collection reads are treated as one complete load: a failed users/revisions/
tombstones read shows retry inside the shared frame with Save/Restore/Publish
disabled, never an editable partial dataset. Invalid
local draft JSON is retained with a visible warning until explicit Save/Restore.

`userRecords()` merges:

- real cloud users;
- board participant-derived users;
- admin owner/admin identity records;
- local lifecycle overlays only for `?test=1` or records that do not have a
  cloud UID. In production, fresh `users/{uid}` data wins over stale browser
  lifecycle cache;
- deleted tombstones.

## Admin Screens

| Screen | Main functions | Data |
| --- | --- | --- |
| Dashboard | `renderDashboard` | board/user/admin/revision summaries |
| Relationship Map | `renderRelationshipMap` | User -> Character -> Board/Admin relationships |
| Boards | `renderBoards`, `renderBoardDetail` | draft board list and board detail |
| Users | `renderUsers`, `renderUserDetail` | merged user/account records |
| Board Admins | `renderAdmins`, `renderAdminDetail` | Admin IDs and owned boards |
| Deleted IDs | `renderTombstones` | reusable username tombstones |
| Audit | `renderAuditLog` | published board revisions and local draft differences |
| Revisions | `renderRevisions` | Admin publish history |
| Support | `renderSupportTools` | backend password reset, JSON export, links to Users/Boards |

## Shared Admin Composition

The 2026-10-14 Dashboard reference defines one Admin frame for all nine screens
and board/user/admin detail views, including pages whose content has not been
redesigned. `renderMain()` owns the frame; `renderPageBody()` provides its contents.
Default entry remains Boards; `?tab=dashboard` opens Dashboard.

- The same green header, navigation rail, parchment surface, content gutters and
  landscape footer appear throughout. They use `assets/admin-reference/` artwork.
- Dashboard's parchment palette is the source of truth for **every Admin tab**,
  including screens whose internal layouts have not been redesigned. Use the
  `--admin-parchment`, `--admin-parchment-card` and `--admin-parchment-border`
  tokens in `admin/design.css`; do not assign a new paper hue per page. Entity
  accents and status colors may differ inside cards, while surrounding paper,
  ordinary panels and the footer keep the shared Dashboard treatment.
- At 1024px and above the 224px rail stays visible. Below 1024px, a hamburger
  opens an overlay with focus containment, background inertness, Escape, backdrop
  dismissal and focus return. Selecting a destination closes it.
- Below 1200px, header actions move into one disclosure. Save, Restore, Publish
  and Sign out retain their existing behavior and IDs; controls are not duplicated.
- The parchment uses sliced image borders. Do not stretch the entire transparent
  artwork as the page background: its transparent edges can intrude into headings.
  Mobile decorative border width is 12px; larger screens use 22px.
- Dashboard uses four centered KPI cards, recent draft changes, required-metadata
  attention rows and supported quick actions. Desktop panels use two columns;
  tablet/mobile panels stack and KPIs use two columns. Compact recent activity
  shows three rows with View all opening Version Control.
- Counts and draft changes come from current records. The reference's sample
  counts, relative timestamps, version string and unsupported Invite user action
  are not copied. View users opens the existing account list instead.
- Subpage tables/details keep their own information layouts. Shared composition
  does not require every page to become a dashboard grid.

Reference, artwork provenance, snapshots and verification are recorded in
`docs/admin-dashboard-2026-10-14/README.md`.

### Boards responsive list — 2026-10-14

`renderBoards()` uses the Dashboard paper tokens and shared Admin shell. At
1200px and above, all eight editable columns remain visible. At 768–1199px,
the table shows URL, type, name, member/entry counts and actions; admin fields
remain available in Detail. Below 768px the same records become reading cards,
with Detail providing the full edit form. Do not restore a horizontally clipped
desktop table on phones or introduce a page-specific parchment palette.

Search matches name, URL, Admin ID and admin nickname without replacing the
focused input. Type filters combine with the query. Show up to four shortcuts
on larger screens and two on phones; all matching records remain in the list.
No-results and empty states are distinct. Confirmed creation clears a Boards
search so the new draft is visible, retaining the selected board type.

Row `Members` opens the existing Members detail section and its Party Ledger
link. It replaces the reference's `+ User` without implying unsupported account
creation or bypassing invitations. Detail and Members always open the requested
section. Draft URL/name/admin edits stay coherent across responsive views. Pending
password resets stay masked when navigating or filtering. Save/Restore/Publish,
validation and confirmed deletion retain their existing contracts; no backend,
authorization or data ownership changes are part of this redesign.

Reference, visual comparisons and verification scope:
`docs/admin-boards-2026-10-14/README.md`.

### Board Info scroll composition — 2026-10-14

Board detail has one scroll layout. The old Tabs mode and Layout toggle have
been removed, including their state and alternate rendering branch. Order:
Board Info + Stats, Owner/Admin, Members, Change Log, Versions, Archive/Delete.
At 1200px and above the first pair is two columns and every section is visible.
Below 1200px sections stack and use accessible disclosures; Info opens by
default, Members also opens on tablets (768px+), while other sections collapse.
Disclosure choices survive re-rendering and resizing; no fields are removed.
The Boards list's Members action opens and scrolls directly to that section.

Use the shared Dashboard shell and parchment palette. Board Info adds a rolled
parchment title, a desktop Tavern strip, sliced paper borders and illustrated
Tavern icons, from `assets/admin-board-info/` and existing shared artwork.
Preserve centered statistics, compact mobile member cards, real financial
metrics, and confirmed draft-only lifecycle operations. Do not restore the
unsupported `Unsettled` draft-proxy statistic from the illustrative reference.

Owner edits retain input focus and update visible title/IDs/links immediately.
Change Log is filtered by original board identity, never title text; Version
labels retain their global revision number. Missing/invalid dates display `—`
and serialized Firestore timestamps are supported. Missing Admin IDs still
open the real group through its original board identity. Save, export,
validation and Publish keep their existing data and authorization contracts.

Reference, asset provenance and targeted verification:
`docs/admin-board-info-2026-10-14/README.md`.

### Board Admins responsive list — 2026-10-14

`renderAdmins()` shares the Dashboard header, navigation, parchment tokens and
footer. Desktop (≥1200px) keeps editable ID/nickname fields and all six columns.
Tablet (768–1199px) groups ID/nickname and User/Owner Hash into four columns;
mobile uses reading cards. Compact views edit through the existing Admin Detail
form. Never inherit the generic table's minimum width on this responsive table.

Search matches Admin ID, nickname, group key and the linked owner's ID/name/
username, preserving the focused input. Four Detail shortcuts appear on larger
screens; mobile starts with two and a working disclosure. Compact board lists
show the first board and a count that reveals every remaining board link.
Missing ownership stays `orphaned`; missing Owner Hash is `—`, not the fallback
Admin ID. User/Board chips keep their actual destinations. Counts describe
loaded admin groups; empty data and no matching results are separate states.

ID/nickname edit handlers bind the original active board IDs, not the mutable
fallback group key. This prevents later keystrokes from being lost when a group
has no Owner Hash. The Detail identity follows the new key after edits, and its
own ID chip is passive. Owner-hash grouping, independent groups that happen to
share an Admin ID, and existing Save/Restore/Publish contracts remain intact.
No backend, authentication or ownership migration is introduced.

Reference, current responsive evidence and targeted verification:
`docs/admin-board-admins-2026-10-14/README.md`.

### Users responsive list — 2026-10-14

`renderUsers()` reuses Dashboard's shared header, navigation, paper tokens,
frame and footer. At 1200px and above it shows the eight-column table. At
768–1199px the same rows become compact grouped records; below 768px they become
reading cards with equal-width Profile / Detail actions. Status, User ID,
character identity, board count, profile level/reputation and admin roles retain
their actual values. Keep all matching records; do not truncate to the mockup's
visible sample. Four Detail shortcuts wrap into two columns on phones.

Search matches display name, username, User ID and character name/ID, ignores
case and surrounding whitespace, and retains the mounted input for typing/IME.
The heading reports the total visible users; the list reports filtered counts.
No-results offers Clear search; an empty account list has a distinct state.

Tablet/mobile More actions opens the existing accessible portal dialog with
Boards, Admin roles, Account lifecycle and Export data. These reuse the current
detail sections and selected-user export, including existing lifecycle
confirmation/backend checks. Opening a user from the list always starts at the
requested scroll section without hiding the other sections. Profile
links preserve the Character ID and Admin return route. Records without a
Character ID have a disabled Profile action in both list and detail.

The reference's New User button is intentionally omitted: Admin has no supported
account-creation flow. Signup remains the existing account owner; this redesign
does not add authentication, account creation or data-model behavior. Deleted
records remain in Deleted IDs, separate from visible Users.

Reference, visual comparisons and verification scope:
`docs/admin-users-2026-10-14/README.md`.

### User Profile continuous detail — 2026-10-14

`renderUserDetail()` is a single scroll page: Profile Summary, Character,
Boards, Admin roles, Activity and Account lifecycle. All six sections stay open
at every breakpoint. The old tab state, tab renderer and unused tab CSS are
removed. List shortcuts and the Lifecycle action scroll to the relevant section
and move keyboard focus to its heading; they do not select a hidden panel.

Board Info remains the visual authority for the shared title-scroll artwork,
Tavern icons, paper frames and Dashboard parchment palette. Both detail pages
use `adminDetailHeading()`, `adminTavernIcon()` and `adminTavernBanner()`.
User Profile uses the centered heading variant: title, actual account metadata
and supported actions are vertically stacked inside one paper panel. A narrow
decorative Tavern strip separates it from the content, without a quote card.
The global Admin header, navigation and footer remain shared.

Desktop uses a profile-summary column beside the remaining sections. Tablet
stacks the sections below the summary; mobile turns board rows into reading
cards and keeps actions touch-sized. Long names, usernames, IDs and board names
wrap inside the paper. Profile Reputation and Character XP remain distinct.

Profile links keep their actual Character ID and Admin return URL. Board/Admin
links open the corresponding real records. Export is scoped to the selected
user and retains secret redaction. Missing Owner Hash is shown as `—`, not a
synthetic group key. Activity uses the existing related-board changes, with
safe date formatting and an honest empty state. No demo activity graph,
Impersonate, Invite Admin or unsupported character-edit action is introduced.

Account lifecycle, reset and delete handlers retain their existing confirmation,
validation and backend authorization. Account lifecycle changes take effect
after confirmation and do not wait for Board Publish. Board draft behavior is
unchanged. Evidence: `docs/admin-user-profile-2026-10-14/README.md`.

### Deleted IDs responsive audit list — 2026-10-14

`renderTombstones()` uses the same Dashboard shell, paper palette and footer.
Desktop ≥1200px shows eight columns, including a read-only Detail action.
Tablet 768–1199px groups each record into identity/status and labeled metadata;
mobile <768px stacks those fields into cards with full-width Detail buttons.
Compact records start expanded. Their 44px disclosure controls preserve focus
and collapsed state while filtering or changing viewport. Desktop always shows
all fields regardless of the compact disclosure state.

Search matches User ID, username and Character IDs, ignoring case and surrounding
whitespace. The focused input remains mounted. The heading shows the total loaded
tombstones; filtered counts and separate empty/no-results states describe the
current list. Users and Deleted IDs reuse `clearAdminSearch()` for Clear search.

User/Character chips here are historical facts, never links to an active account
that may reuse an ID. Detail uses the existing accessible portal modal to show
full User ID, username, Character IDs, previous UID, status, deletion time, source
and recorded reason. Missing values remain explicit. Long previous UIDs truncate
only in the list; Detail wraps the complete value for inspection. No edit,
restore, reclaim, delete or other privileged operation is added.

`tombstoneRecords()` remains the data owner: cloud username tombstones merge
with local lifecycle records and exclude currently visible active User IDs.
Existing Firestore query limits, auth, reuse rules and backend deletion paths
are unchanged. Visual fixture checks do not prove production authorization.

Reference, visual comparisons and verification scope:
`docs/admin-deleted-ids-2026-10-14/README.md`.

### Relationship Map

`renderRelationshipMap()` renders the existing selected record (first visible
user with an admin role, otherwise first visible user) as four groups: Global
User ID, Character, Admin IDs and Boards. Each group retains all its actual
records. Board nodes are deduplicated by original ID, not object identity.
User/Admin/Board chips keep their existing detail actions; Character IDs remain
read-only. Board ownership is labeled "managed by" to avoid reversing its meaning.

Desktop and tablet use four columns with gold connectors. Mobile below 768px
uses vertical cards/downward connectors and a keyboard-operable disclosure for
the four-color legend and model rules. A single record per group gives equal
card heights; multiple records grow naturally without stretching a lone user
card to the entire board list. Empty users/relationships do not invent records.
The existing account-profile identity rules remain authoritative over mockup
sample copy. Evidence: `docs/admin-relationship-map-2026-10-14/README.md`.

## Draft And Publish

Most board edits mutate `draft.boards` and call `markDirty()`. They are not live
until Publish.

Publish flow:

1. `validateDraft()`
2. `diffBoards()`
3. confirmation modal
4. Firestore transaction checks loaded baselines and writes only changed `trips/{id}` plus `adminRevisions/{id}`
5. local draft is cleared
6. published data is reloaded

## User Management

Recoverable lifecycle:

- `active`
- `archived`
- `deactivated`
- `delete_requested`
- `deleted`

`performUserLifecycle()` requires a reason and writes status fields to `users/{uid}` and
`usernames/{username}` and `userIds/{userId}` atomically. Player login guards must
respect blocked statuses.

Admin password reset:

- calls `/api/admin-reset-user` with the Google-auth Firebase ID token;
- verifies the Super Admin allowlist server-side;
- updates the existing Auth credential, recreating the same UID only when Auth
  is missing; rejects blocked accounts or changed identity ownership;
- preserves UID, public User ID and Character ID;
- updates character owner pointer;
- stores only the new recovery hash in `users/{uid}` and returns the raw Recovery
  ID once for handoff.

Permanent delete:

- disabled unless `/api/admin-delete-status` reports service-account env ready;
- requires reason and exact `DELETE <userId>` confirmation;
- sends Google-auth ID token to `/api/admin-delete-user`;
- backend verifies allowlisted Gmail and performs Auth/doc deletion and
  tombstoning.

## Cleanup and flow corrections — 2026-10-14

- Archive/Reopen changes `archived`, `archivedAt` and `status`, retaining members,
  expenses and unknown fields. Permanent deletion remains a separate confirmed
  action that takes effect on Publish. Archive must never call `deleteBoard`.
- New board IDs are four digits; changed IDs and board names validate before
  Publish. Unchanged legacy IDs remain readable. Board data-only edits are
  included in the publish diff. Revisions identify the actual signed-in Admin.
- Search updates results without replacing the focused input, including during
  continuous typing/composition. Modal keyboard focus is contained and returned;
  Close/Escape always cancel rather than executing the first action.
- Export downloads a real `coin-quest-admin-export-v1` JSON snapshot of loaded
  data (including drafts). Passwords, recovery values, tokens, owner hashes and
  auth metadata are recursively omitted. This is a support export, not a
  credential-complete disaster recovery backup.
- Removed obsolete impersonation, merge, invite-admin and add-account stubs,
  fabricated activity charts, fake unsettled totals, and unsupported historical
  Restore/View-diff buttons. Revision details remain expandable.
- Removed board-local character rename/class/XP and arbitrary Character ID
  mutation. These could orphan ledger name references or contradict canonical
  account identity. Profiles remain viewable; membership uses Party Ledger's
  Character ID invitation/Guest flows. Admin does not create fake character IDs.
- Removed the unused browser recovery hashing/email-minting helpers and CSS
  belonging only to the retired prototype controls.

## Current Limitations

- Account creation, merges, impersonation and canonical character editing are
  not offered by this portal. No placeholder operation should report success.
- Revisions store change summaries, not historical board snapshots; restoring
  an arbitrary historical version is therefore not supported.
- Audit Log displays board publish revisions/draft changes. It is not a claim
  that every credential/lifecycle operation has an immutable audit event.
- Debt/Treasury dashboard totals cover legacy board records, not all private
  `playerModules/{uid}` finance data.
- Board security is signed-in-only in Firestore rules, but not yet
  owner/member-scoped.

## Verification

Admin changes usually require Production Patch verification:

```bash
npm test
```

Focused checks:

```bash
npx playwright test tests/e2e/coin-quest-ledger.spec.mjs --grep "super admin"
npx playwright test tests/e2e/admin-flow-audit.spec.mjs
node --test tests/unit/admin-delete-user.test.mjs
```

Live browser and isolated-test evidence for this cleanup is in
`docs/flow-audit-2026-10-14/README.md`. Local changes are not deployed until a
separate release is completed.
## Backend repair notes — 2026-10-12

Publishing now writes only changed boards and checks the draft's captured content
against a fresh transaction read. Stale drafts or occupied destination IDs abort
without deleting local work or writing a revision. Lifecycle changes update user,
username and User ID together and refuse accounts with an active recovery lease.
Admin tombstone listing is allowed by rules while player enumeration stays denied.

Delete checks target ownership before Auth changes, clears module data/nested
invites, and preserves shared financial history as board-local guests. Legacy
orphan cleanup rereads each board in a transaction to preserve concurrent edits.
Both privileged APIs require verified allowlisted email and non-revoked tokens.
Historical local evidence and remaining limits are recorded in
`docs/backend-audit-2026-10-12.md`. Release status must be verified against the
exact CI commit, Vercel alias and Firebase Rules release.
