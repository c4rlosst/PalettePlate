# PalettePlate

A local-first Filipino food tracker. Next.js App Router, TypeScript, Tailwind, MySQL, Drizzle, and Better Auth. No Supabase database or Supabase Auth.

## Food sources and cleaning

`scripts/seed-foods.ts` contains a small repeatable, validated transcription of food names from [DA-AMAS, October 26–November 1, 2026](https://www.da.gov.ph/wp-content/uploads/2026/11/Weekly-Average-Prices-October-26-November-1-2026.pdf). The [DA portal](https://www.da.gov.ph/price-monitoring/) states public domain unless otherwise stated; no contrary notice was found for this list when checked on November 10, 2026. No price or nutritional data is imported. Each row stores the source, rights notice, and mapping provenance.

Cleaning trims whitespace, normalizes Unicode to NFC, validates names/categories/colors, and uses stable IDs. Rerunning preserves existing records and preferences. Filipino translations and color classifications are project annotations, not DA classifications. Red: tomato/watermelon; orange: squash/carrot/ripe papaya; yellow: ripe mango; green: bitter melon/pechay/sitaw/chayote/avocado; blue-purple: eggplant skin; white-brown: potato/garlic/banana flesh/rice. Grains are searchable but excluded from the rainbow count. This is an initial UX taxonomy, not laboratory pigment analysis. Values refer to the edible part described; cultivar and preparation differences remain a limitation. Nutritional values are null and flagged; do not invent values or scrape restricted PhilFCT data.

## Database changes and backups

Edit `src/db/schema.ts` (the reasoning behind the tables is in [docs/schema-decisions.md](docs/schema-decisions.md)), run `npm run db:generate`, review numbered SQL, and run `npm run db:migrate`. Never use schema push or edit live tables. Initial migration creates InnoDB tables under the database's utf8mb4 collation.

Use `npm run db:dump`. Dumps go to ignored `backups/`. To restore intentionally: `npm run db:restore -- backups/FILE.sql --confirm`. This replaces data; restore to a rehearsal database first. Put MySQL CLI tools on PATH or set `MYSQL_BIN` and `MYSQLDUMP_BIN` to absolute executable paths. Hosted TLS supports `DATABASE_TLS=true` and optional `DATABASE_CA`; backup tools accept `DATABASE_CA_FILE`. `DATABASE_POOL_SIZE` sets the app's connection pool size (default 3, maximum 5). Passwords are passed through the child environment, never command arguments.

## Security and current limitations

App data queries live in `src/server/data.ts`; each operation requires a verified actor and scopes reads/writes to their ID. Auth-library persistence is handled by its Drizzle adapter. Browser requests cannot set roles. Sessions and rate limits live in MySQL. Passwords use Argon2id. Production HTTPS uses Secure, httpOnly, SameSite=Lax cookies; local HTTP must use non-Secure cookies. Codes are hashed in the database. URL-based verification/reset endpoints are disabled. React escapes user text. Server actions use Zod and Next.js origin checks. CSP currently allows inline scripts required by the framework; move to per-request nonces before publishing.

This is not the entire MVP. Logging a recipe in a meal, recipe photos, a moderation queue, historical day browsing, and full Tagalog copy remain unfinished. Friends and shares remain stretch goals.

**Feed and photos.** Signed-in users can post a photo (optionally linked to a cookbook recipe), heart posts and comment. Posts publish immediately; authors can delete their own posts and comments, and admins can delete any. Photos are stored in a private S3-compatible bucket configured with the `STORAGE_*` variables (see `.env.example`). The browser shrinks and re-encodes each photo (which removes camera metadata such as GPS), the server accepts only JPEG, PNG or WebP by checking the file's first bytes, caps uploads at 4 MB, and serves images only to signed-in users through `/api/images/:id`. A photo that was uploaded but never posted stays unattached; each user can hold at most 10 of those. Moderation and abuse controls beyond admin deletion are not built yet.

**People and profile pictures.** Names and avatars on posts and comments link to `/people/:id`. That page shows only a person's display name, picture, join month and published posts; email, contact number, region and gender are never shown to other members. A profile picture is cropped to a square in the browser, stored in the same bucket under `avatars/`, and its path is kept in the user's `image` column; changing or removing it deletes the old file.

Manual source review, dependency auditing, and automated ownership/role tests are used for this slice; they do not replace a deployment review. The legacy drizzle-kit helper's esbuild dependency is overridden to a patched compatible version; migration generation is verified after that change. `npm audit` reports zero vulnerabilities at implementation time. Session tokens use case-sensitive collation. Do not deploy until the [deployment checklist](docs/deploy-checklist.md) and end-to-end auth/database tests pass.
