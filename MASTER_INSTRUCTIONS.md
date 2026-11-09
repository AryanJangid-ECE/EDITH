# MASTER_INSTRUCTIONS.md - Permanent Rules for Cursor (E.D.I.T.H.)

These rules apply to every phase and every change. If a phase prompt conflicts with these rules, stop and ask the user.

## 1. Before You Do Anything (every phase)

1. Inspect the workspace: list files and folders; run `git status` and `git log --oneline -n 10`.
2. Read `PROJECT_CONTEXT.md` completely and this file completely.
3. Read the existing code of every file you plan to touch.
4. State the plan for the current phase in a short list (files to create, files to modify, commands to run, risks). If the plan is large or ambiguous, wait for the user's "go".
5. Check that all phases listed as dependencies are marked DONE in `PROJECT_CONTEXT.md` Section 19. If not, stop and tell the user.

## 2. Understanding the Architecture

- `PROJECT_CONTEXT.md` is the authority for: event schema, constants, formulas, rules, database schema, API contracts, UI guidelines and the Interaction Register. Implement exactly what it says. If you believe it is wrong, stop and ask; do not silently deviate.
- Layering (backend): `routers` (HTTP only) -> `services` (business logic) -> `models` (persistence). Routers never contain business logic. Services never import from routers. Pure logic (scoring, rules) lives in side-effect-free functions that are unit-testable without a database.
- Layering (frontend): `api/` (typed fetch + hooks) -> `features/` (page logic) -> `components/` (presentation). Components do not call `fetch` directly.
- The simulator must only produce data by calling the same ingestion service a real agent would use.

## 3. Scope Discipline (prevent breaking things)

- Implement **only** the phase named in the current prompt. Do not start or "prepare" later phases. Do not add features that are not listed.
- Do not refactor, rename, reformat or reorganize code outside the files required for the current phase.
- Never overwrite an existing file blindly. Read it first; make minimal edits; preserve behaviour and existing tests.
- Never delete or weaken a test to make it pass. Fix the code or ask the user.
- Do not change public API shapes, database column names or event schema fields unless the phase prompt says so; if a change is unavoidable, update `PROJECT_CONTEXT.md` and list the change in your report.
- Do not add dependencies that are not listed in the phase prompt without asking. When you add an approved dependency, pin it in `requirements.txt` or `package.json` and mention it in the report.
- Before finishing a phase, run the full existing test suites (backend and frontend) to confirm there are no regressions.
- Never run destructive commands (`rm -rf` outside build/cache folders, `git reset --hard`, `git push --force`, dropping the database) without explicit user approval.

## 4. Coding Standards

**Python (backend):** type hints on all functions; Pydantic models for all request/response bodies; ruff for lint and formatting; functions small and single-purpose; no global mutable state except the EventBus and simulator controller (documented); `snake_case` names; constants in `services/constants.py`; docstrings for services and non-obvious logic.

**TypeScript (frontend):** `strict` mode, no `any` (use `unknown` and narrow); ESLint clean; functional components and hooks; one component per file; props typed with interfaces; Tailwind utility classes using the design tokens in `tailwind.config.ts` (no hard-coded hex values in components); shared types mirror backend schemas.

**General:** no dead code, no commented-out blocks, no TODO placeholders for essential features, no `console.log` in committed code (use the logger on the backend), meaningful names, early returns, handle every error path.

## 5. Folder and File Management

- Follow the folder structure in `PROJECT_CONTEXT.md` Section 16. Create folders only as needed by the current phase.
- One responsibility per file. Keep files under roughly 300 lines; split when larger.
- Do not create duplicate utilities; search before adding a helper.
- Generated or local files (`.env`, `*.db`, `node_modules`, `.venv`, `dist`, `__pycache__`, test reports) must be in `.gitignore`.

## 6. Backend Rules

- FastAPI routers are thin: parse and validate input, call a service, return a Pydantic response.
- Use dependency injection for the DB session and current user (`require_user`, `require_owner`).
- All business state lives in the database. No essential state only in memory, except the simulator's running flag (mirrored in `sim_state`).
- Every write goes through a service and is wrapped in a transaction; on failure roll back and return the uniform error body.
- All timestamps in UTC ISO-8601; sandbox events use simulated time derived from `sim_tick`.
- Background simulator loop: one task; each tick isolated in its own transaction; log failures and continue.

## 7. Frontend Rules

- Follow the design tokens, typography and component list in `PROJECT_CONTEXT.md` Section 12 exactly. Reuse primitives from `components/ui`; never restyle ad hoc.
- Every data view must implement: loading skeleton, empty state, error state with Retry.
- Every mutation must show a success toast (stating the effect; Undo where applicable) and an error toast.
- Every visible button, link, menu item, toggle and input must perform a real action that appears in the Interaction Register. Do not ship decorative controls. If a control cannot work yet in the current phase, do not render it.
- No static mock data in shipped screens where the backend provides the data. Prop-driven demo data is allowed only on the dev-only `/dev/components` route introduced in Phase 3.
- Accessibility: semantic HTML, labels, visible focus, keyboard support, `aria-live` only where specified, no colour-only status.
- Responsive at 360, 768 and 1280 px; no horizontal page scroll.

## 8. Database and API Conventions

- Primary keys are UUID strings. Table names plural `snake_case`; columns `snake_case`. JSON columns only where `PROJECT_CONTEXT.md` specifies.
- Avoid SQLite-only SQL; keep the code portable to PostgreSQL. Add indexes exactly as specified.
- Schema changes: update models, seed script, and `PROJECT_CONTEXT.md` Section 10 in the same change.
- REST: JSON bodies, `snake_case` keys, plural nouns, correct HTTP verbs and status codes (201 for creation, 204 only when no body). Pagination via `limit` and `cursor`. All errors use the uniform error body.
- Do not break an existing endpoint's request/response contract; additive changes only unless approved.
- WebSocket messages use `{type, payload}` exactly as specified.

## 9. Security Requirements

- Follow `PROJECT_CONTEXT.md` Section 13 in every phase.
- Never hard-code secrets; read from environment through `config.py`. Never commit `.env`.
- Never log tokens, passwords or API keys.
- Validate all inputs with enums and length limits; use parameterised queries only.
- Enforce roles on the server for every write route; hiding a button in the UI is never sufficient.
- Treat the synthetic data as synthetic: never add real personal data or real network calls (except the optional LLM call in Phase 11).

## 10. Error Handling

- Backend: raise typed domain errors (for example `NotFoundError`, `ConflictError`, `ForbiddenError`) handled centrally into the uniform error body. Never leak stack traces to clients. Log with request ID.
- Frontend: typed API client throws `ApiError {code, message, status}`; UI shows the message in toast or inline; error boundaries catch rendering failures.
- No silent `except: pass`. No swallowed promise rejections.

## 11. Testing Requirements

- Every phase ends with tests for the logic it added. A feature is complete only when its business logic passes tests, not when its UI exists.
- Backend: pytest with an isolated temporary database per test session; fixed seeds for the simulator; unit tests for pure functions; API tests with `httpx`/TestClient for every endpoint, including auth, validation errors and role restrictions.
- Frontend: Vitest + React Testing Library for components with logic; Playwright for the end-to-end scenario (Phase 13).
- Tests must be deterministic: no sleeps based on wall-clock where avoidable; drive the simulator by stepping ticks.
- Report real command output (pass counts, failures). Never claim "tests pass" without running them. If a test fails, fix the cause; do not delete or loosen the test.
- Run lint and type-check (`ruff`, `eslint`, `tsc --noEmit`) and the production build for the frontend before declaring a phase complete.

## 12. Documentation Maintenance

At the end of every phase, update:
1. `PROJECT_CONTEXT.md`: Section 19 status and notes (with date), Section 21 change log line, and any section whose facts changed (schema, API, folders, decisions, limitations).
2. `README.md`: setup, run, test commands, current feature list, demo credentials (from `.env.example`).
3. `docs/` files if they exist.
Documentation must describe only what actually exists and works.

## 13. Git Practices

- Work on a branch per phase: `phase-<number>-<short-name>`. Commit in small logical steps with Conventional Commit messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`).
- Make sure `git status` is clean of unintended files before committing. Never commit secrets, databases or build output.
- When the phase is complete and the user approves, merge to `main` (or tell the user the merge command) and tag `phase-<number>-done`.
- Never force-push or rewrite history without explicit approval.

## 14. Honesty and Reporting Rules

- Never claim a feature works unless it is implemented and tested. Distinguish "implemented and tested", "implemented, not tested" and "not implemented" in reports.
- Never present simulated data as real. Preserve the SIMULATED / REAL DEVICE labelling.
- Do not leave essential functionality as placeholders or hidden TODOs.
- If something is blocked, ambiguous or impossible as specified, stop and ask one clear question.

## 15. Required End-of-Phase Report (use this exact structure)

1. **Phase and goal**
2. **What was implemented** (short list)
3. **Files created / modified** (paths)
4. **Dependencies added** (name, version, why)
5. **Commands run and their real results** (tests, lint, type-check, build)
6. **Acceptance criteria**: each item marked PASS or FAIL with evidence
7. **Completion checklist** status
8. **Known issues / incomplete work / risks**
9. **Documentation updated** (which sections)
10. **Exact commands for the user to run and verify manually**
11. **Ask for approval** to proceed; do not start the next phase.