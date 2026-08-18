# LMS-FRONTEND

Angular 21 standalone app with PrimeNG Aura theme, PrimeIcons, PrimeFlex.
SCSS styles; `src/styles.scss` imports `primeicons/primeicons.css` and `primeflex/primeflex.css`.

## Commands

| Command                  | Action                                             |
| ------------------------ | -------------------------------------------------- |
| `npm start`              | Dev server (`ng serve`, proxies `/api` → `:3000`)  |
| `npm run build`          | Prod build (budgets: initial 900kB/1MB)            |
| `npm test`               | Unit tests (Vitest via `@angular/build:unit-test`) |
| `npm run watch`          | Build with watch + dev config                      |
| `npx prettier --write .` | Format everything                                  |

**No linting** (no ESLint). Formatting via Prettier (single quotes, printWidth 100, Angular HTML parser).

## Architecture

- **Entrypoint:** `src/main.ts` bootstraps standalone `App` via `bootstrapApplication`
- **Config:** `src/app/app.config.ts` — router, HTTP client (`authInterceptor` + `errorInterceptor`), PrimeNG Aura theme, async animations
- **Routing** (role-based, lazy-loaded via `loadComponent`/`loadChildren`):
  - `''` → loads auth routes (effectively login)
  - `/login` — public
  - `/admin`, `/coordinator`, `/treasury`, `/teacher`, `/secretary`, `/human-resources` — each guarded by `AuthGuard` + `RoleGuard` with `data.roles`, loads `MainLayoutComponent` + role child routes
  - `/perfil` — guarded by `AuthGuard`, children: `''` (ProfileComponent), `cambiar-password` (ChangePasswordComponent)
  - `**` → redirects to `login`
- **Layout:** `MainLayoutComponent` (template with sidebar + `<router-outlet />`), `SidebarComponent` filters nav items by `user.role()`
- **Core:** `src/app/core/` — `guards/`, `interceptors/`, `services/`, `models/`
- **Features:** `src/app/features/` — `auth/`, `admin/`, `coordinator/`, `treasury/`, `teacher/`, `secretary/`, `human-resources/`, `profile/`, `users/`
- **API base:** `http://localhost:3000/api` (`src/environments/environment*.ts`, dev file-replacement in `angular.json`)
- **Proxy:** `proxy.conf.json` forwards `/api` → `http://localhost:3000` (dev server only)

## Guards & Interceptors

- `AuthGuard` (class-based `CanActivate`): checks `isLoggedIn()`, redirects to `/login` if false
- `RoleGuard` (class-based `CanActivate`): checks `route.data['roles']` against `role()`, navigates to `/dashboard` on mismatch
  - ⚠️ `/dashboard` is not a valid route (likely should redirect to role's root path instead)
- `authInterceptor` (functional, `HttpInterceptorFn`): adds `Authorization: Bearer <token>` to all requests except `/auth/refresh`
- `errorInterceptor` (functional): on 401 (not `/auth/login` or `/auth/refresh`) attempts token refresh via `AuthService.refresh()`, queues concurrent requests with `BehaviorSubject`; on 403 with `"suspendida"` message clears session and redirects with `?suspended=true`

## Auth pattern

- JWT in `localStorage` keys `accessToken` / `refreshToken`
- `AuthService` stores auth state as `signal<AuthState>` with derived `computed()` signals (`accessToken`, `role`, `isLoggedIn`, `user`)
- `login(id, password)` POSTs `{ id, passwordRaw: password }` to `/auth/login`
- `refresh()` POSTs `{ refreshToken }` to `/auth/refresh`, updates tokens
- `getProfile()` GETs `/users/me`, updates user signal
- `role` decoded from JWT payload (`atob` of token segment 1), field `role`
- `clearSession()` wipes localStorage and resets state signal
- `logout()` POSTs to `/auth/logout`, then clears session

## Services (all `providedIn: 'root'`)

- `AuthService` — auth ops, token/state management via signals
- `UserService` — CRUD at `/users`, paginated GET with `page`, `limit`, `role`, `search` params; also `changePassword()`, `uploadAvatar()` (FormData)
- `AdminService` — admin-specific endpoints at `/admin`
- `AcademicService` — CRUD for academic terms, modalities, careers, subjects at `/admin/academic`
- `CoordinatorService` — coordinator operations
- `TeacherService` — teacher operations
- `TreasuryService` — treasury operations
- `SecretaryService` — secretary operations
- `HumanResourcesService` — human resources operations
- `InstitutionService` — institution config operations

## Models (`src/app/core/models/index.ts`)

Key types: `User`, `LoginResponse`, `AuthState`, `AppRole`, `PaginatedResponse<T>`, `Tuition`, `CareerSubject`, `Subject`, `Enrollment`, `Assignment`, `Submission`, `AcademicTerm`, `Modality`, `Career`, `SemesterColor`.

## Testing (Vitest)

- `ng test` runs Vitest via `@angular/build:unit-test` builder
- `tsconfig.spec.json` has `types: ["vitest/globals"]`
- Only 1 spec exists: `src/app/features/auth/first-login/first-login.spec.ts`; no snapshot testing
- Dependencies: `jsdom` for DOM emulation

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

> Existing components may still use older patterns (class properties, constructor DI, `*ngIf`/`*ngFor`). Follow the conventions above for new code.

## AI instruction files

Six identical generic Angular-best-practice files exist across AI tool dirs. Keep them in sync if updating conventions:
`.claude/CLAUDE.md`, `.cursor/rules/cursor.mdc`, `.gemini/GEMINI.md`, `.junie/guidelines.md`, `.windsurf/rules/guidelines.md`, `.github/copilot-instructions.md`
