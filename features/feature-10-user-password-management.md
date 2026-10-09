# Feature: User Password Management

**Feature ID:** 10
**Branch pattern:** `feature/10-user-password-management`
**Status:** Ready
**Created:** 2026-10-08
**Input:** Signed-in admin users open a Users list, edit a Feature 1 user, and set a new password for that account on the user edit page.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 4 — People Management](feature-4-people-management.md)

---

## User Stories

### US-10.1: Select to work with Users

**As a** signed-in admin user  
**I want to** open the users view from the menu  
**So that** I can maintain login accounts

**Priority:** P1  
**Independent test:** Sign in as admin; **Users** appears; clicking it opens the users view  
**Acceptance scenarios:** see ### US-10.1 under Acceptance Criteria

### US-10.2: View users

**As a** signed-in admin user  
**I want to** see all users on one screen  
**So that** I can pick an account to edit

**Priority:** P1  
**Independent test:** Users view lists existing Feature 1 users by username  
**Acceptance scenarios:** see ### US-10.2 under Acceptance Criteria

### US-10.3: Change a user's password on the user edit page

**As a** signed-in admin user  
**I want to** set a new password on the user edit page  
**So that** that person can sign in with the new password

**Priority:** P1  
**Independent test:** Open edit for a user, enter a new password and matching confirm, save; that user can sign in with the new password and not the old one  
**Acceptance scenarios:** see ### US-10.3 under Acceptance Criteria

### US-10.4: Restrict user password change to admins

**As the** application  
**I want to** allow only users with role `admin` to open Users and change passwords  
**So that** managers and students cannot change another account's password

**Priority:** P1  
**Independent test:** Sign in as a manager — **Users** is hidden; `PUT /league/users/:userId` with a password returns `403`  
**Acceptance scenarios:** see ### US-10.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: This feature MUST deliver an admin **Users** list and an **Edit User** page (dialog on that list, same catalog pattern as [Feature 4](feature-4-people-management.md)). No sidebar/main split. No second `MenuBar`.
- **FR-002**: `GET /league/users` remains admin-only (Feature 4). The users view MUST load that list. Columns: **username**, **last name**, **first name**. Rows ordered by `username`.
- **FR-003**: Each row MUST show an **Edit user** icon that opens **Edit User** pre-filled with that user's `fName`, `lName`, `username`, and `email`. Those identity fields are **read-only** on this page. This feature does **not** change name, email, username, or role.
- **FR-004**: **Edit User** MUST include **New password** and **Confirm password**. Save MUST send `PUT /league/users/:userId` with `{ "password": "<new password>" }` only when both fields are filled and match. Empty password fields MUST block save with inline **"Password is required."** and MUST NOT call the API.
- **FR-005**: `PUT /league/users/:userId` with `password` MUST require a valid session and `req.user.role` equal to `admin`. Success MUST hash the password with bcrypt (`SALT_ROUNDS = 10`) and MUST NOT return the hash or plaintext. Unknown `userId` → `404` `{ "message": "User with id=<id> not found." }`. Password shorter than 8 characters → `400` `{ "message": "Password must be at least 8 characters." }`. The user's other columns MUST stay unchanged.
- **FR-006**: After a successful password change, that user MUST be able to sign in with the new password (Feature 1 `POST /league/login`). The previous password MUST fail login with `{ "message": "Invalid username or password." }`. Existing sessions for that user MAY remain valid.
- **FR-007**: Authenticated non-admin users (including `manager` and `student`) MUST receive `403` `{ "message": "Admin role required." }` on `PUT /league/users/:userId`. They MUST NOT see **Users** in `MenuBar`. Unauthenticated navigation to `/users` MUST redirect to `login`. Unauthenticated `PUT` MUST return `401`.
- **FR-008**: The admin does **not** enter the user's current password. Client confirm-mismatch message: **"Passwords do not match."** (no API call).

---

## Assumptions

- Features 1 and 4 MUST be merged to `dev` before implementing this feature.
- Users already exist via Feature 1 register. This feature does not create or delete users.
- Feature 4 `GET /league/users` (`id`, `username`, `fName`, `lName`) is the list source. Edit MAY `GET /league/users/:userId` for `email` if the list row does not include it. Responses MUST never include `password`.
- Dialog-based edit on the users list is the **user edit page** for this product (same structure as People / Leagues).
- A user with role `admin` exists (tests may seed an admin). Role `manager` is non-admin for this feature.
- API mount is `/league/…`. Use `/league/users/:userId`.

## Edge Cases

- Empty new password or confirm → **"Password is required."**; no API call.
- Password shorter than 8 characters → client **"Password must be at least 8 characters."** and/or API `400` with the same message.
- Confirm does not match → **"Passwords do not match."**; no API call.
- Unknown `userId` on PUT → `404` `{ "message": "User with id=<id> not found." }`
- Authenticated `manager` or `student` on PUT → `403`.
- Unauthenticated PUT → `401`.
- Admin changes their own password from this list → allowed; same rules as any other user.

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A signed-in admin can open **Users**, edit a user, set a new password, and that user can sign in with it.
- **SC-003**: A manager or student cannot see **Users** and cannot change a password via the API.
- **SC-004**: `npm test` passes for the mapped users and MenuBar scenarios.

---

## Data Ownership & Isolation

Users remain Feature 1 login accounts. This feature does not add per-user ownership of the users table. Only `admin` may list users for this screen and change passwords.

| Rule            | Requirement                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| **Read scope**  | Admin `GET /league/users` returns all users (Feature 4). No password field. |
| **Write scope** | Only `admin` may `PUT` a password on `/league/users/:userId`.               |
| **Cross-user**  | Non-admin PUT → `403`. Missing user → `404`.                                |
| **UI scope**    | **Users** menu and `/users` are admin-only.                                 |

---

## API Requirements

| Method | Endpoint                  | Auth       | Purpose                                      |
| ------ | ------------------------- | ---------- | -------------------------------------------- |
| `GET`  | `/league/users`           | Yes, admin | List users (Feature 4; used by this view)    |
| `GET`  | `/league/users/:userId`   | Yes, admin | Fetch one user for the edit page (no password) |
| `PUT`  | `/league/users/:userId`   | Yes, admin | Set a new password for that user             |

**Change password request body:**

```json
{
  "password": "newpass123"
}
```

Do not send `id`. Omit name, email, username, and role — this PUT MUST change only `password`.

**User success response** (`200` on GET one / PUT):

```json
{
  "id": 2,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "role": "manager"
}
```

Do **not** include `password`. Feature 4 list `GET /league/users` stays `{ "id", "username", "fName", "lName" }`.

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.

---

## Screen Requirements

### [View: Users] — route name `users` — path `/users` — `Users.vue`

- Heading: **Users**
- No **+ New user** (register stays Feature 1).
- List: `v-table` (or `v-list`); columns **username**, **last name**, **first name**; rows ordered by username.
- Icon-only row action, `size="small"`, accessible `aria-label`:
  - **Edit user** — opens **Edit User** `<v-dialog>`
- **Empty state:** **"No users yet."** when the list has zero users.
- **Loading state:** skeleton or progress indicator while users are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Admin-only: **Users** menu item and `/users` are for signed-in admin users. Other roles do not see **Users**. Unauthenticated navigation to `/users` redirects to `login`.

### [View: Edit User] — dialog on Users

- Title: **Edit User**
- Read-only: **First Name**, **Last Name**, **Email**, **Username** (pre-filled).
- Editable: **New password**, **Confirm password** (`v-text-field`, `type="password"`).
- Actions: **Save** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- Client-side validation before API call; server errors in `<v-alert type="error">`.
- On success, the dialog closes. The list stays on screen.

**App chrome**

- Use the Feature 1 `MenuBar`. Do **not** create a second `MenuBar`.
- Add **Users** (allowed role `admin`; navigates to `/users`) after **People**.
- Students and managers MUST NOT see **Users**.

---

## Key Entities

- **User**: Feature 1 login account. This feature changes only the stored password hash for a chosen `users.id`.

---

## Data Model Requirements

No new tables or columns. `users.password` stays `STRING(255)`, required, bcrypt hash only (Feature 1).

---

## Acceptance Criteria (Gherkin)

### US-10.1 — Select to work with Users

#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `admin`
- **When** I click **Users** in the `MenuBar`
- **Then** the users view is displayed

### US-10.2 — View users

#### Scenario: Users view loads with existing users

- **Given** I am signed in as a user with role `admin`
- **And** a Feature 1 user with username `jdoe` exists
- **When** I open the users view
- **Then** `jdoe` appears in the users list

#### Scenario: Users view with no users shows empty copy

- **Given** I am signed in as a user with role `admin`
- **And** there are no users in the catalog
- **When** I open the users view
- **Then** I see **"No users yet."**

### US-10.3 — Change a user's password on the user edit page

#### Scenario: Admin changes a user password and that user can sign in

- **Given** I am signed in as a user with role `admin`
- **And** a Feature 1 user with username `jdoe` exists with password `password123`
- **And** I am viewing the users view
- **When** I click **Edit user** on `jdoe`
- **And** I enter new password `newpass123` and matching confirm password
- **And** I click **Save**
- **Then** the API returns `200` with that user's `id` and `username` and no `password` field
- **And** the stored password is a bcrypt hash that is not `password123`
- **And** the edit dialog closes
- **And** `POST /league/login` with username `jdoe` and password `newpass123` returns `200`
- **And** `POST /league/login` with username `jdoe` and password `password123` returns `401` with `{ "message": "Invalid username or password." }`

#### Scenario: Admin submits a password that is too short

- **Given** I am signed in as a user with role `admin`
- **And** I am on the **Edit User** dialog for an existing user
- **When** I enter new password `short` and matching confirm password
- **And** I click **Save**
- **Then** inline validation blocks the request
- **And** I see the message **"Password must be at least 8 characters."**
- **And** no API request is sent

#### Scenario: Admin submits mismatched passwords

- **Given** I am signed in as a user with role `admin`
- **And** I am on the **Edit User** dialog for an existing user
- **When** I enter new password `newpass123` and confirm password `otherpass`
- **And** I click **Save**
- **Then** inline validation blocks the request
- **And** I see the message **"Passwords do not match."**
- **And** no API request is sent

#### Scenario: Admin submits an empty password

- **Given** I am signed in as a user with role `admin`
- **And** I am on the **Edit User** dialog for an existing user
- **When** I leave new password empty
- **And** I click **Save**
- **Then** inline validation blocks the request
- **And** I see the message **"Password is required."**
- **And** no API request is sent

#### Scenario: Admin changes the password of a user that does not exist

- **Given** I am signed in as a user with role `admin`
- **When** I send `PUT /league/users/99999` with `{ "password": "newpass123" }`
- **Then** the API returns `404` with `{ "message": "User with id=99999 not found." }`

### US-10.4 — Restrict user password change to admins

#### Scenario: Manager does not see Users in the menu

- **Given** I am signed in as a user with role `manager`
- **When** I view the `MenuBar`
- **Then** **Users** is not shown

#### Scenario: Manager cannot change a user password via the API

- **Given** I am signed in as a user with role `manager`
- **And** a Feature 1 user with id `2` exists
- **When** I send `PUT /league/users/2` with `{ "password": "newpass123" }`
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** that user's password hash is unchanged

#### Scenario: Unauthenticated API request to change a user password

- **Given** I have no session
- **When** I send `PUT /league/users/2` with `{ "password": "newpass123" }`
- **Then** the API returns `401`

#### Scenario: Unauthenticated user accesses the users route

- **Given** I have no session in `localStorage`
- **When** I navigate directly to `/users`
- **Then** I am redirected to the login page

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story   | Scenario                                                      | Test file                                              | Test name                                                      |
| ------- | ------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| US-10.1 | Menu Selection                                                | `frontend/tests/MenuBar.test.js`                       | `Menu Selection` (Users)                                       |
| US-10.2 | Users view loads with existing users                          | `frontend/tests/Users.test.js`                         | `Users view loads with existing users`                         |
| US-10.2 | Users view with no users shows empty copy                     | `frontend/tests/Users.test.js`                         | `Users view with no users shows empty copy`                    |
| US-10.3 | Admin changes a user password and that user can sign in       | `backend/tests/users.test.js`                          | `Admin changes a user password and that user can sign in`      |
| US-10.3 | Admin submits a password that is too short                    | `frontend/tests/Users.test.js`                         | `Admin submits a password that is too short`                   |
| US-10.3 | Admin submits mismatched passwords                            | `frontend/tests/Users.test.js`                         | `Admin submits mismatched passwords`                           |
| US-10.3 | Admin submits an empty password                               | `frontend/tests/Users.test.js`                         | `Admin submits an empty password`                              |
| US-10.3 | Admin changes the password of a user that does not exist      | `backend/tests/users.test.js`                          | `Admin changes the password of a user that does not exist`     |
| US-10.4 | Manager does not see Users in the menu                        | `frontend/tests/MenuBar.test.js`                       | `Manager does not see Users in the menu`                       |
| US-10.4 | Manager cannot change a user password via the API             | `backend/tests/users.test.js`                          | `Manager cannot change a user password via the API`            |
| US-10.4 | Unauthenticated API request to change a user password         | `backend/tests/users.test.js`                          | `Unauthenticated API request to change a user password`        |
| US-10.4 | Unauthenticated user accesses the users route                 | `frontend/tests/router.test.js`                        | `Unauthenticated user accesses the users route`                |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 10 from @features/feature-10-user-password-management.md on branch `feature/10-user-password-management`.

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

- Creating or deleting users (register stays [Feature 1](feature-1-user-auth.md))
- Editing name, email, username, or role
- Self-service password change from **Edit Profile** in `MenuBar`
- Email password reset / forgot-password
- Requiring the current password
- Invalidating existing sessions when the password changes
- OAuth / social login
