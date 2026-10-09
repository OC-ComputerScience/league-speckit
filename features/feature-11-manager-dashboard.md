# Feature: Manager Dashboard

**Feature ID:** 11
**Branch pattern:** `feature/11-manager-dashboard`
**Status:** Ready
**Created:** 2026-10-08
**Input:** When a user with role `manager` signs in, they land on a dashboard for a team they manage. The heading shows team info and **Edit team**. Below it, two columns: season games (season combo for that team's league; date, time, opponent, location, score; edit icon to enter the score) and the roster (number, name, position; add and edit).
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Season Management](feature-2-season-management.md), [Feature 5 — Team Management](feature-5-team-management.md), [Feature 6 — Game Management](feature-6-game-management.md), [Feature 9 — Team Manager](feature-9-team-manager.md)

---

## User Stories

### US-11.1: Land on the manager dashboard after sign-in

**As a** signed-in user with role `manager`  
**I want** the home page to be the dashboard for a team I manage  
**So that** I start on my team, not the admin welcome page

**Priority:** P1  
**Independent test:** Sign in as a manager linked to a person who manages one team; `/` shows that team's heading  
**Acceptance scenarios:** see ### US-11.1 under Acceptance Criteria

### US-11.2: Edit the managed team from the heading

**As a** signed-in user with role `manager`  
**I want** an **Edit team** button and dialog on the dashboard heading  
**So that** I can update that team's name and home field

**Priority:** P1  
**Independent test:** On the dashboard, **Edit team** opens the dialog; save updates the heading  
**Acceptance scenarios:** see ### US-11.2 under Acceptance Criteria

### US-11.3: View season games for the managed team

**As a** signed-in user with role `manager`  
**I want** a season combo of seasons in my team's league and a list of that team's games  
**So that** I can see date, time, opponent, location, and score

**Priority:** P1  
**Independent test:** Select a season that has a game for the managed team; the row shows date, time, opponent, location, and score when present  
**Acceptance scenarios:** see ### US-11.3 under Acceptance Criteria

### US-11.4: Enter a game score

**As a** signed-in user with role `manager`  
**I want** an edit icon on each game that opens a score dialog  
**So that** I can record the home and visiting scores

**Priority:** P1  
**Independent test:** Open **Edit score** on a game, enter both scores, save; the list shows those scores  
**Acceptance scenarios:** see ### US-11.4 under Acceptance Criteria

### US-11.5: Add and edit players on the dashboard

**As a** signed-in user with role `manager`  
**I want** a player list (number, name, position) with **Add** and an edit icon on each row  
**So that** I can maintain the roster without leaving the dashboard

**Priority:** P1  
**Independent test:** **Add** opens Add Player; **Edit player** opens Edit Player; the list updates  
**Acceptance scenarios:** see ### US-11.5 under Acceptance Criteria

### US-11.6: Restrict the dashboard and manager writes

**As the** application  
**I want** only role `manager` to see this dashboard, and only for teams they manage  
**So that** admins keep their catalogs and managers cannot change other teams' games or rosters

**Priority:** P1  
**Independent test:** Admin home stays the Feature 1 welcome page; a manager `PUT` of another team's game or team returns `403`  
**Acceptance scenarios:** see ### US-11.6 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: After a successful Feature 1 login or register, a user with role `manager` MUST land on route `home` (`/`). For that role, `/` MUST show the **manager dashboard** (`ManagerDashboard.vue`), not the Feature 1 admin/student welcome copy. Admins and students keep the existing Feature 1 home on `/`.
- **FR-002**: The dashboard MUST show one managed team (Feature 9: teams whose `managerId` is the person linked to `req.user.id`). If the manager has exactly one team, show that team. If they have more than one, show a **Team** `v-select` of those teams (display team `name`) and the first team by name as the default. If they have none, show **"No teams assigned."** and no games or players columns.
- **FR-003**: The **heading** MUST show team **name**, **league** name, and **home field**. **Edit team** (`oc-cta`) MUST open the **Edit Team** `<v-dialog>` pre-filled with **Team Name** and **Home Field**. League is read-only in the heading (not editable here). The dialog MUST NOT include **Manager** or a player list. Actions: **Save Team** (`oc-cta`) / **Cancel**. This supersedes Feature 9 **FR-012** (“Managers MUST NOT see **Edit team**”) **on this dashboard only**. Feature 5 `Team.vue` **Edit team** stays admin-only.
- **FR-004**: `PUT /league/teams/:teamId` MUST allow `admin` (unchanged) and MUST allow `manager` when that team is one they manage. A manager’s body MAY include `name` and `homeField` only. `leagueId` and `managerId` MUST stay unchanged (omit them, or if sent they MUST match the stored values). Feature 5 name and home-field validation still applies. A manager MUST receive `403` `{ "message": "Admin role required." }` when updating a team they do not manage.
- **FR-005**: Below the heading, the dashboard MUST be two columns (`v-row` / `v-col`, half width on desktop). **Left column — Games:** a **Season** `v-select` of Feature 2 seasons whose `leagueId` is this team’s league (display season `name`), then a list of Feature 6 games for that season where this team is home or visiting. Columns: **date**, **time**, **opponent** (the other team’s name), **location**, **score**. Rows ordered by `gameDate` then `startTime`. Score: when both `homeTeamScore` and `visitingTeamScore` are non-null, show `{homeTeamScore}–{visitingTeamScore}`; otherwise leave score empty. Each row has **Edit score** (`aria-label` **Edit score**).
- **FR-006**: If the league has no seasons, the season combo is empty and the games list shows **"No seasons in this league."** If a season is selected and this team has no games in it, show **"No games for this season."** Selecting another season MUST refresh the game list. Default season: the first season by `startDate` (Feature 2 order) when any exist.
- **FR-007**: **Edit score** opens **Enter Score** `<v-dialog>` with **Home Team Score** and **Visiting Team Score** (labels MAY include the team names). Both are required on save. Feature 6 range `0`–`999` and message **"Score must be between 0 and 999."** apply. Actions: **Save Score** (`oc-cta`) / **Cancel**. Save MUST `PUT /league/games/:gameId` with only `{ "homeTeamScore", "visitingTeamScore" }`. Other game columns MUST stay unchanged. The manager MUST NOT change date, time, opponent, location, season, or teams from this dialog.
- **FR-008**: `PUT /league/games/:gameId` MUST allow `admin` (full Feature 6 edit unchanged) and MUST allow `manager` when the game’s home or visiting team is one they manage **and** the body is only scores. A manager MUST receive `403` `{ "message": "Admin role required." }` when the game does not include a team they manage, or when they send other fields (date, teams, location, season).
- **FR-009**: **Right column — Players:** list columns **number**, **name** (person last name, first name), **position**, ordered by `number`. **Add** (`oc-cta`) opens Feature 5 **Add Player**. The **Person** `v-select` MUST include **Add Person**. Selecting **Add Person** MUST show Feature 4 person fields in the same dialog (**First Name**, **Last Name**, **Email**, **Birth Date**, **Gender** — no **User**). **Add** MUST `POST /league/people` then `POST` the player with the new `personId`. `POST /league/people` MUST allow `admin` and `manager`. Each row has **Edit player**. Feature 5 / Feature 9 player validation and `POST`/`PUT` `/league/teams/:teamId/players` rules apply (manager already allowed on managed teams). Empty roster: **"No players yet. Add the first player."** This column does **not** add **Remove player** (Team view keep that).
- **FR-010**: `GET /league/seasons` and `GET /league/games` stay allowed for any authenticated role (Features 2 and 6). The dashboard MUST filter those lists in the UI (and MAY filter via existing query params if already supported). No new tables. Unauthenticated `/` still redirects to `login`.
- **FR-011**: Admins MUST NOT see this two-column dashboard on `/`. Managers MUST NOT see **Teams** or **Games** in `MenuBar`. No second `MenuBar`. This supersedes Feature 9 **FR-012** (Managers see **Teams**). The dashboard on `/` is the manager’s team UI.

---

## Assumptions

- Features 1, 2, 5, 6, and 9 MUST be merged to `dev` before implementing this feature.
- Manager identity is still Feature 9: `user` → `people.userId` → `teams.managerId`.
- Season list for the combo is the shared catalog filtered to `seasons.leagueId === team.leagueId`.
- Opponent is the nested `homeTeam` or `visitingTeam` that is not the managed team.
- Score entry does not create games. Admins still create the schedule (Features 6–8).
- Dialog-based edit (no sidebar/main split), same catalog pattern as Team / Games.
- Tests MAY seed a manager user, linked person, one team, one season in that league, one opponent team, and one game.
- API mount is `/league/…`.

## Edge Cases

- Manager with no linked person or no managed teams → **"No teams assigned."**
- Manager with two teams → team combo; changing team reloads heading, seasons, games, and players.
- League with no seasons → **"No seasons in this league."**
- Season with no games for this team → **"No games for this season."**
- Game with null scores → score cell empty; **Edit score** still shown.
- Score not 0–999 → **"Score must be between 0 and 999."**; no API call or `400`.
- One score filled and the other empty → **"Required"**; no API call.
- Manager `PUT` team they do not manage → `403`.
- Manager `PUT` game they are not in → `403`.
- Manager `PUT` game with `gameDate` or `location` in the body → `403`.
- Admin signs in → Feature 1 home; not this dashboard.
- Student or manager signs in → no **Teams** in `MenuBar`. Student sees Feature 1 home; manager sees the dashboard.

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A manager who manages a team lands on `/` and sees that team’s heading, games column, and players column.
- **SC-003**: That manager can edit the team’s name or home field from **Edit team**.
- **SC-004**: That manager can pick a season, see this team’s games, and save a score.
- **SC-005**: That manager can add and edit players on the dashboard.
- **SC-006**: A manager cannot change another team’s row or a game they are not in.
- **SC-007**: `npm test` passes for the mapped dashboard, team, game, and Home/MenuBar scenarios.

---

## Data Ownership & Isolation

Teams and games stay shared catalogs. This feature only widens **write** for a manager’s own team and scores on that team’s games.

| Rule            | Requirement                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| **Read scope**  | Manager `GET` teams is still Feature 9 (only managed teams). Seasons and games `GET` stay all rows.  |
| **Write scope** | Manager may `PUT` name/homeField on a managed team and scores on a game that includes that team.     |
| **Cross-team**  | Other team or game → `403` `{ "message": "Admin role required." }`                                   |
| **UI scope**    | Dashboard is role `manager` on `/` only. Admin catalogs unchanged.                                   |

---

## API Requirements

No new endpoints. This feature changes who may `PUT` a team and who may `PUT` scores on a game.

| Method | Endpoint                         | Auth                         | Purpose                                      |
| ------ | -------------------------------- | ---------------------------- | -------------------------------------------- |
| `GET`  | `/league/teams`                  | Yes (Feature 9 filter)       | Manager’s teams for the dashboard            |
| `PUT`  | `/league/teams/:teamId`          | Yes, admin **or** manager of that team | Update name and home field          |
| `GET`  | `/league/seasons`                | Yes                          | Season combo (filter to team’s league in UI) |
| `GET`  | `/league/games`                  | Yes                          | Games list (filter to team + season in UI)   |
| `PUT`  | `/league/games/:gameId`          | Yes, admin **or** manager on that game (scores only) | Enter score              |
| `GET`  | `/league/teams/:teamId/players`  | Yes                          | Roster (or nested `players` on the team)     |
| `POST` | `/league/teams/:teamId/players`  | Yes, admin or manager of team | Add player (Feature 9)                      |
| `PUT`  | `/league/teams/:teamId/players/:playerId` | Yes, admin or manager of team | Edit player (Feature 9)            |

**Manager update team request body:**

```json
{
  "name": "OKC Strikers",
  "homeField": "Memorial Field"
}
```

**Manager enter score request body:**

```json
{
  "homeTeamScore": 2,
  "visitingTeamScore": 1
}
```

**Error response:** `{ "message": "Human-readable explanation." }`  
Unknown team/game → `404` with the existing Feature 5 / 6 not-found messages.

---

## Screen Requirements

### [View: Manager Dashboard] — route name `home` — path `/` — `ManagerDashboard.vue` (shown from `Home.vue` when `user.role` is `manager`)

- **Heading area:** team name, league name, home field; **Edit team**.
- If the manager has more than one team: **Team** `v-select` in the heading.
- **Edit Team** dialog: **Team Name**, **Home Field**; **Save Team** / **Cancel**.
- **Left column:** heading **Games**; **Season** `v-select`; table/list of games (date, time, opponent, location, score); **Edit score** icon per row.
- **Enter Score** dialog: home score, visiting score; **Save Score** / **Cancel**.
- **Right column:** heading **Players**; **Add** (`oc-cta`); table/list (number, name, position); **Edit player** icon per row.
- **Add Player** / **Edit Player:** same fields and actions as Feature 5 (`Person`, **Number**, **Position`). **Add Player** **Person** list includes **Add Person**; that choice shows **First Name**, **Last Name**, **Email**, **Birth Date**, and **Gender**.
- Loading / error: progress + `<v-alert type="error">`.
- Empty copy as in FR-002 / FR-006 / FR-009.

**App chrome**

- Feature 1 `MenuBar`. No new catalog item required (dashboard **is** `/`).
- Managers MUST NOT see **Teams**, **Leagues**, **Games**, **People**, **Seasons**, or **Users**.

---

## Key Entities

- **Manager dashboard**: home screen for role `manager` for one managed **Team**.
- **Opponent**: the other team on a **Game**.
- **Score**: optional Feature 6 `homeTeamScore` / `visitingTeamScore`.

---

## Data Model Requirements

No new tables or columns. Uses Feature 5 `teams` / `players`, Feature 2 `seasons`, Feature 6 `games`, Feature 9 `managerId`.

---

## Acceptance Criteria (Gherkin)

### US-11.1 — Land on the manager dashboard after sign-in

#### Scenario: Manager sees the dashboard for the team they manage

- **Given** I am a user with role `manager` linked to a person who manages team `OKC Strikers`
- **When** I sign in
- **Then** I am on the home page
- **And** the heading shows team name `OKC Strikers`

#### Scenario: Manager with no assigned team sees empty copy

- **Given** I am a user with role `manager` who manages no teams
- **When** I sign in
- **Then** I see **"No teams assigned."**

### US-11.2 — Edit the managed team from the heading

#### Scenario: Manager edits team name and home field

- **Given** I am signed in as a manager on the dashboard for `OKC Strikers`
- **When** I click **Edit team**
- **And** I change team name to `OKC United` and home field to `North Field`
- **And** I click **Save Team**
- **Then** the API returns `200` with name `OKC United` and `homeField` `North Field`
- **And** the heading shows `OKC United` and `North Field`
- **And** the edit dialog closes

### US-11.3 — View season games for the managed team

#### Scenario: Manager lists games for a selected season

- **Given** I am signed in as a manager on the dashboard for `OKC Strikers` in league `OKC Youth Soccer`
- **And** season `2026 Fall` is in that league
- **And** a game on `2026-09-12` at `18:00` at `Memorial Field` has opponent `Tulsa FC` and scores `2` and `1`
- **When** I select season `2026 Fall`
- **Then** the games list shows date `2026-09-12`, time `18:00`, opponent `Tulsa FC`, location `Memorial Field`, and score `2–1`

#### Scenario: Manager sees empty games copy

- **Given** I am signed in as a manager on the dashboard for `OKC Strikers`
- **And** season `2026 Fall` has no games for that team
- **When** I select season `2026 Fall`
- **Then** I see **"No games for this season."**

### US-11.4 — Enter a game score

#### Scenario: Manager enters a game score

- **Given** I am signed in as a manager on the dashboard for `OKC Strikers`
- **And** a game for that team has no scores
- **When** I click **Edit score**
- **And** I enter home team score `3` and visiting team score `0`
- **And** I click **Save Score**
- **Then** the API returns `200` with `homeTeamScore` `3` and `visitingTeamScore` `0`
- **And** the games list shows score `3–0`
- **And** the dialog closes

#### Scenario: Manager submits an invalid score

- **Given** I am signed in as a manager on the **Enter Score** dialog
- **When** I enter home team score `1000` and visiting team score `0`
- **And** I click **Save Score**
- **Then** I see **"Score must be between 0 and 999."**
- **And** no API request is sent

### US-11.5 — Add and edit players on the dashboard

#### Scenario: Manager adds a player from the dashboard

- **Given** I am signed in as a manager on the dashboard for `OKC Strikers`
- **When** I click **Add**
- **And** I select a person, number `10`, and position `Forward`
- **And** I click **Add**
- **Then** the player appears with number `10` and position `Forward`

#### Scenario: Manager adds a player with a new person

- **Given** I am signed in as a manager on the dashboard for `OKC Strikers`
- **When** I click **Add**
- **And** I select **Add Person**
- **And** I enter first name `Robert`, last name `Smith`, email `robert.smith@example.com`, birth date `1990-05-15`, gender `male`, number `7`, and position `Goalkeeper`
- **And** I click **Add**
- **Then** the player appears with number `7` and position `Goalkeeper`

#### Scenario: Manager edits a player from the dashboard

- **Given** I am signed in as a manager on the dashboard for `OKC Strikers`
- **And** a player with number `10` is on the roster
- **When** I click **Edit player**
- **And** I change position to `Midfield`
- **And** I click **Save Player**
- **Then** the list shows position `Midfield`

### US-11.6 — Restrict the dashboard and manager writes

#### Scenario: Manager does not see Teams in the menu

- **Given** I am signed in as a user with role `manager`
- **When** I view the `MenuBar`
- **Then** **Teams** is not shown

#### Scenario: Admin home is not the manager dashboard

- **Given** I am signed in as a user with role `admin`
- **When** I view the home page
- **Then** I do not see **Edit score**
- **And** I see the League Management System welcome copy

#### Scenario: Manager cannot update a team they do not manage

- **Given** I am signed in as a user with role `manager`
- **And** team id `2` is not a team I manage
- **When** I send `PUT /league/teams/2` with a new name
- **Then** the API returns `403` with `{ "message": "Admin role required." }`

#### Scenario: Manager cannot score a game they are not in

- **Given** I am signed in as a user with role `manager`
- **And** game id `2` does not include a team I manage
- **When** I send `PUT /league/games/2` with `{ "homeTeamScore": 1, "visitingTeamScore": 0 }`
- **Then** the API returns `403` with `{ "message": "Admin role required." }`

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story   | Scenario                                           | Test file                                | Test name                                           |
| ------- | -------------------------------------------------- | ---------------------------------------- | --------------------------------------------------- |
| US-11.1 | Manager sees the dashboard for the team they manage | `frontend/tests/Home.test.js`            | `Manager sees the dashboard for the team they manage` |
| US-11.1 | Manager with no assigned team sees empty copy      | `frontend/tests/Home.test.js`            | `Manager with no assigned team sees empty copy`     |
| US-11.2 | Manager edits team name and home field             | `frontend/tests/Home.test.js`, `backend/tests/teams.test.js` | `Manager edits team name and home field` |
| US-11.3 | Manager lists games for a selected season          | `frontend/tests/Home.test.js`            | `Manager lists games for a selected season`         |
| US-11.3 | Manager sees empty games copy                      | `frontend/tests/Home.test.js`            | `Manager sees empty games copy`                     |
| US-11.4 | Manager enters a game score                        | `frontend/tests/Home.test.js`, `backend/tests/games.test.js` | `Manager enters a game score` |
| US-11.4 | Manager submits an invalid score                   | `frontend/tests/Home.test.js`            | `Manager submits an invalid score`                  |
| US-11.5 | Manager adds a player from the dashboard           | `frontend/tests/Home.test.js`            | `Manager adds a player from the dashboard`          |
| US-11.5 | Manager adds a player with a new person            | `frontend/tests/Home.test.js`, `backend/tests/people.test.js` | `Manager adds a player with a new person` / `Manager creates a person via the API` |
| US-11.5 | Manager edits a player from the dashboard          | `frontend/tests/Home.test.js`            | `Manager edits a player from the dashboard`         |
| US-11.6 | Manager does not see Teams in the menu             | `frontend/tests/MenuBar.test.js`         | `Manager does not see Teams in the menu`            |
| US-11.6 | Admin home is not the manager dashboard            | `frontend/tests/Home.test.js`            | `Admin home is not the manager dashboard`           |
| US-11.6 | Manager cannot update a team they do not manage    | `backend/tests/teams.test.js`           | `Manager cannot update a team they do not manage`   |
| US-11.6 | Manager cannot score a game they are not in        | `backend/tests/games.test.js`           | `Manager cannot score a game they are not in`       |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 11 from @features/feature-11-manager-dashboard.md on branch `feature/11-manager-dashboard`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

- [x] Backend and frontend implemented per this spec (**FR-00N** satisfied)
- [x] **Success Criteria (SC-00N)** met
- [x] All mapped tests pass (`npm test`)
- [x] Test Coverage Map complete
- [x] `features/reference/data-model.md` updated (if schema changed)
- [x] `features/reference/api.md` updated (if API changed)
- [x] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- Creating or deleting games from the dashboard
- Changing game date, time, opponent, location, or season as a manager
- Changing the team’s league or manager from this dialog
- **Remove player** on the dashboard (stays on Feature 5 `Team.vue`)
- Showing this dashboard to `admin` or `student`
- A new **Games** or **Dashboard** menu item
- Email / push reminders for upcoming games

---

## Delivered to later features

- Managers can edit their team’s name and home field and enter scores on their games. Later features MUST keep other game fields and team league/manager as admin-only unless a new spec says otherwise.
