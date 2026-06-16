# LMS-FRONTEND

Angular 21 standalone app with PrimeNG Aura theme + PrimeIcons.
SCSS for component styles; `src/styles.scss` imports `primeicons/primeicons.css`.

## Commands

| Command                  | Action                                             |
| ------------------------ | -------------------------------------------------- |
| `npm start`              | Dev server (`ng serve`)                            |
| `npm run build`          | Prod build (budgets: initial 500kB/1MB)            |
| `npm test`               | Unit tests (Vitest via `@angular/build:unit-test`) |
| `npm run watch`          | Build with watch + dev config                      |
| `npx prettier --write .` | Format everything                                  |

**No linting** (no ESLint). Formatting via Prettier (single quotes, printWidth 100, Angular HTML parser).

## Architecture

- **Entrypoint:** `src/main.ts` bootstraps standalone `App` via `bootstrapApplication`
- **Config:** `src/app/app.config.ts` — router, HTTP client (auth interceptor), PrimeNG Aura theme, async animations
- **Routes** (`src/app/app.routes.ts`): lazy-loaded via `loadComponent`:
  - `/login` — public, loads `LoginComponent`
  - `/dashboard` — protected by `AuthGuard` (class-based `CanActivate`), child `/dashboard/users`
  - `/` redirects to `/login`
  - _Dashboard nav has a `/dashboard/courses` menu item but no route or feature exists yet_
- **Core:** `src/app/core/` — `guards/`, `interceptors/`, `services/`
- **Features:** `src/app/features/` — `auth/login`, `dashboard`, `users/users-list`
- **API base:** `http://localhost:3000/api` (`src/environments/environment*.ts`, dev file-replacement in `angular.json`)

## Auth pattern

- JWT in `localStorage` keys `accessToken` / `refreshToken`
- `authInterceptor` (functional interceptor, `HttpInterceptorFn`) adds `Authorization: Bearer <token>`
- `AuthGuard` checks `isLoggedIn()`, redirects to `/login` if missing
- `AuthService.login(id, password)` POSTs `{ emailOrCedula, password }` to `${apiUrl}/auth/login`, stores tokens
- Also: `register()`, `logout()`, `getRoleFromToken()` (decodes JWT payload for `role`), `getProfile()` (GET `/users/me`)

## Services

- `AuthService` — auth operations, token storage, role extraction from JWT
- `UserService` — paginated user CRUD (`getUsers`, `updateUser`, `deleteUser`). GET params: `page`, `limit`, `role`. Response shape: `{ data: User[], pagination: { total, current_page, last_page } }`.

## Stub files to be aware of

- `auth/login/` has two components: `LoginComponent` (full, used by router) and `Login` (stub, imported by spec `login.spec.ts`)
- `core/services/auth.ts` + `auth.spec.ts` are scaffold stubs (unused)

## Testing (Vitest)

- `ng test` runs Vitest via `@angular/build:unit-test` builder
- Specs use standard Angular `TestBed` (see `app.spec.ts`, `login.spec.ts`)
- `tsconfig.spec.json` has `types: ["vitest/globals"]`
- No snapshot testing

## Conventions (target state for new code)

- Standalone components: **omit** `standalone: true` (default in Angular 20+)
- `input()`/`output()` functions over `@Input()`/`@Output()` decorators
- `signal()` for local state, `computed()` for derived state; use `set`/`update`, never `mutate`
- Reactive forms via `FormBuilder`
- Native control flow (`@if`, `@for`, `@switch`) over `*ngIf`/`*ngFor`/`*ngSwitch`
- `host` object in `@Component` instead of `@HostBinding`/`@HostListener`
- `ChangeDetectionStrategy.OnPush`
- `inject()` function over constructor injection
- PrimeNG components: import the module, provide `MessageService`/`ConfirmationService` in component `providers` where needed
- Prettier: single quotes, trailing comma, Angular HTML parser
- `providedIn: 'root'` for services

> Note: Existing components still use class properties, constructor DI, `standalone: true`, `*ngIf`/`*ngFor`, and no `OnPush`. Follow the conventions above for **new** code.

## Cross-platform AI instruction files

- `.claude/CLAUDE.md` and `.cursor/rules/cursor.mdc` contain near-identical generic Angular best-practice rules (same conventions as above). Keep them in sync if updating conventions.

## Tooling

- Node: npm 11.12.1 (pinned in `packageManager`)
- `.editorconfig`: 2-space indent, UTF-8
- `.vscode/extensions.json` recommends `angular.ng-template`
