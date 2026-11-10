# PalettePlate

A local-first Filipino food tracker. Next.js App Router, TypeScript, Tailwind, MySQL, Drizzle, and Better Auth. No Supabase database or Supabase Auth.

## Local setup

Requires Node.js 22+, npm, and MySQL. This workstation uses MySQL 9.6 by explicit project-owner approval; the optional Docker service remains pinned to 8.4.7. Verify migrations against the chosen hosted version before deployment.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` if it does not exist. Keep `.env` private. Generate `AUTH_SECRET` with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Set `APP_URL` to the origin you use in your browser.
3. On this Windows workstation, run `npm run db:start`, then `npm run db:create`. The first command uses the installed MySQL 9.6 binaries to start a separate loopback-only instance on **127.0.0.1:3307**, with data under ignored `.local/mysql/`. It generates credentials and leaves other MySQL instances untouched. The second creates `paletteplate` and its app account, saves `DATABASE_URL` in `.env`, and removes the admin URL. Root credentials remain private in `.local/mysql/admin-url`; keep this file safe. Set `MYSQL_BASE_DIR` for a different installation path. It refuses to overwrite an existing database. Database creation is infrastructure bootstrap; application tables change only through migrations.
4. Run `npm run db:setup` to migrate then seed.
5. Run `npm run mail:start` to start the installed local Mailpit inbox (SMTP port 1025, web inbox port 8025). This workstation has Mailpit 1.27.10 in ignored `.local/mailpit/`; other teammates can install Mailpit on PATH or use the Docker service below. Mail stays on this computer. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and optional credentials in `.env`. Verification codes are delivered by email; they are never printed to the app logs.
6. Run `npm run dev`, open the origin configured in `APP_URL`, and create an account. Enter the emailed code, then sign in.

After the first setup, **`npm run local:start`** starts the private MySQL instance, Mailpit, and app together. On this workstation the app origin is `http://127.0.0.1:3000`. You do not need the administrator password for the pre-existing MySQL instance. `.local/` contains local databases, private credentials, and binaries; it must never be committed.

If you prefer your own running server, supply `DATABASE_ADMIN_URL=mysql://root:URL_ENCODED_PASSWORD@127.0.0.1:PORT` in `.env` and run `npm run db:create` without `db:start`.

For teammates using Docker: configure the `MYSQL_*` variables and a matching `DATABASE_URL`, then run **`npm run db:local`**. This starts MySQL and Mailpit, waits for database health, migrates, and seeds. For this option use MySQL host `127.0.0.1`, SMTP host `127.0.0.1`, port `1025`. Mailpit's inbox is at `http://127.0.0.1:8025`. Example env values are placeholders; replace them before running.

## Try the first slices

- Sign up, verify email, sign in, sign out, reset your password with an emailed code, and edit your profile.
- Open Foods; search Filipino or English names, filter category/colour, and like/dislike foods.
- Log a meal, select foods and Philippine time, then view it on Today. Delete a meal to correct an entry.
- Log four distinct fruit/vegetable colours; repeats and grains do not add colours. Liked foods from missing colours appear as suggestions.
- `npm test` tests rainbow boundaries and server-side ownership/role checks. For real MySQL isolation tests, set `RUN_DB_TESTS=1` before running `npm test`; they insert and remove only uniquely identified test users. `npm run typecheck` checks types. `npm run build` checks the production bundle.

## Food sources and cleaning

`scripts/seed-foods.ts` contains a small repeatable, validated transcription of food names from [DA-AMAS, October 26–November 1, 2026](https://www.da.gov.ph/wp-content/uploads/2026/11/Weekly-Average-Prices-October-26-November-1-2026.pdf). The [DA portal](https://www.da.gov.ph/price-monitoring/) states public domain unless otherwise stated; no contrary notice was found for this list when checked on November 10, 2026. No price or nutritional data is imported. Each row stores the source, rights notice, and mapping provenance.

Cleaning trims whitespace, normalizes Unicode to NFC, validates names/categories/colours, and uses stable IDs. Rerunning preserves existing records and preferences. Filipino translations and colour classifications are project annotations, not DA classifications. Red: tomato/watermelon; orange: squash/carrot/ripe papaya; yellow: ripe mango; green: bitter melon/pechay/sitaw/chayote/avocado; blue-purple: eggplant skin; white-brown: potato/garlic/banana flesh/rice. Grains are searchable but excluded from the rainbow count. This is an initial UX taxonomy, not laboratory pigment analysis. Values refer to the edible part described; cultivar and preparation differences remain a limitation. Nutritional values are null and flagged; do not invent values or scrape restricted PhilFCT data.

## Database changes and backups

Edit `src/db/schema.ts`, run `npm run db:generate`, review numbered SQL, and run `npm run db:migrate`. Never use schema push or edit live tables. Initial migration creates InnoDB tables under the database's utf8mb4 collation.

Use `npm run db:dump`. Dumps go to ignored `backups/`. To restore intentionally: `npm run db:restore -- backups/FILE.sql --confirm`. This replaces data; restore to a rehearsal database first. Put MySQL CLI tools on PATH or set `MYSQL_BIN` and `MYSQLDUMP_BIN` to absolute executable paths. Hosted TLS supports `DATABASE_TLS=true` and optional `DATABASE_CA`; backup tools accept `DATABASE_CA_FILE`. Passwords are passed through the child environment, never command arguments.

## Security and current limitations

App data queries live in `src/server/data.ts`; each operation requires a verified actor and scopes reads/writes to their ID. Auth-library persistence is handled by its Drizzle adapter. Browser requests cannot set roles. Sessions and rate limits live in MySQL. Passwords use Argon2id. Production HTTPS uses Secure, httpOnly, SameSite=Lax cookies; local HTTP must use non-Secure cookies. Codes are hashed in the database. URL-based verification/reset endpoints are disabled. React escapes user text. Server actions use Zod and Next.js origin checks. CSP currently allows inline scripts required by the framework; move to per-request nonces before publishing.

This is the first local implementation, not the entire MVP. Recipe editing/logging, community posts, image uploads, admin screens/middleware, historical day browsing, and full Tagalog copy remain unfinished. Friends and shares remain stretch goals. No upload or admin endpoints are exposed yet. Supabase placeholders reserve configuration for the later image slice; no cloud connection is made.

`/security-review` is not installed in this environment. Manual source review, dependency auditing, and automated ownership/role tests are used for this slice; they do not replace a deployment review. The legacy drizzle-kit helper's esbuild dependency is overridden to a patched compatible version; migration generation is verified after that change. `npm audit` reports zero vulnerabilities at implementation time. Session tokens use case-sensitive collation. Do not deploy until the checklist and end-to-end auth/database tests pass.
