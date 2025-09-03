# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` – Next.js App Router routes (`/dashboard` is primary), root `layout.tsx` and global styles.
- `src/components/` – UI components
  - `dashboard/` (CallControlBar, ClientProfilePanel, TaskManagementPanel, TranscriptionPanel)
  - `ui/` (shadcn/ui primitives)
- `src/lib/` – helpers (`prisma.ts`, `twilio.ts`, `utils.ts`), future `phone.ts`, `call.ts`.
- `src/hooks/` – React hooks (e.g., `useTwilioDevice`).
- `prisma/` – Prisma schema and seeds.
- `public/` – static assets.  `docs/` – architecture and setup docs.

## Build, Test, and Development Commands
- `npm run dev` – Start dev server (port 3500). Open `http://localhost:3500/dashboard`.
- `npm run build` – Production build.
- `npm run start` – Start production server.
- `npm run lint` – ESLint checks.
- Database (optional): `npx prisma generate`, `npx prisma db push`, `npx prisma db seed`.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). ESM modules. React function components.
- Components: PascalCase files in `src/components/**`. Routes/pages in `src/app/**` follow Next.js conventions.
- Styling: Tailwind CSS v4 + shadcn/ui. Use utility classes; avoid inline styles.
- Linting: ESLint (`eslint.config.mjs`). Fix issues before PRs.

## Testing Guidelines
- Framework: Jest + Testing Library (planned). Place tests alongside files or in `src/__tests__/`.
- Naming: `*.test.ts` / `*.test.tsx` (e.g., `TaskManagementPanel.test.tsx`).
- Run: add `"test"` script (recommended) and run `npm test`. Aim for critical logic (helpers, mappings, date/phone utils).

## Commit & Pull Request Guidelines
- Commits: Conventional Commits preferred: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
  - Example: `feat(call): add consent gating to recording toggle`.
- PRs: concise description, linked issue, screenshots for UI, notes on env/DB changes, and updated docs.
- Scope: keep PRs small and focused; pass lint/build locally.

## Security & Configuration Tips
- Env: copy `.env.example` → `.env.local`. Do not commit secrets.
- Twilio: avoid calling `/api/twilio/token` without Twilio env vars set.
- Deployment: Vercel region `syd1` with strict security headers (`vercel.json`).

