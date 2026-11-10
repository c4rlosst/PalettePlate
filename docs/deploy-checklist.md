# Deployment checklist (later; local development only for now)

- [ ] Choose hosted MySQL, confirm the exact version and pin the local Docker image to match. Current native workstation is 9.6 by explicit approval; optional Docker is 8.4.7. Rehearse every migration against the hosted version.
- [ ] Create an utf8mb4/InnoDB database and app credentials with access only to that database. Use a separate migration account where supported; restrict the runtime account to necessary data operations.
- [ ] Set DATABASE_URL, DATABASE_TLS=true, optional DATABASE_CA, DATABASE_POOL_SIZE (default 3, maximum 5), AUTH_SECRET, and APP_URL. Require HTTPS. Configure SMTP credentials/from address and test deliverability. Never expose secrets through NEXT_PUBLIC variables.
- [ ] When uploads are implemented, create a private Supabase bucket; configure server-only URL/service key/bucket. Verify authorization, magic-byte validation, limits, signed URL expiry, and deletion cleanup before exposing uploads.
- [ ] Run npm ci, npm audit, npm test, npm run typecheck, and npm run build. Fix high/critical advisories and assess remaining advisories. Complete a security review, add a nonce CSP, and verify database-backed rate limits across processes.
- [ ] Back up any existing database, run npm run db:migrate, then npm run db:seed once. Check source licences before adding nutrition data. Rehearse dump and restore in a separate database.
- [ ] Smoke-test signup, delivered verification code, verified login, logout/revocation, invalid code limits, password reset, and secure cookie flags. Verify no sensitive values appear in logs, URLs, browser storage, or client bundles.
- [ ] With two accounts, verify isolated preferences, profiles, reads and meal modifications. Test approved-only public posts and server-side admin/moderator checks when those slices exist. Do not publish placeholders as working features.
- [ ] Log meals around Philippine midnight; verify four distinct fruit/vegetable colours and suggestions based on likes. Check empty/error states, mobile, keyboard navigation, contrast, and reduced motion.
- [ ] Confirm final known limitations in README and rehearse the presentation using a recent backup. No deployment or cloud services have been configured by the local setup.
