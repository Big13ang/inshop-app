# InShop real-backend E2E — handoff

Written 2026-10-21 to continue on another machine. Everything below is pushed to Gitea. Nothing is merged.

## Where the code is

| Repo | Branch (pushed to `gitea`) | Commits | Compare |
|---|---|---|---|
| inshop-app | `feature/e2e-real-backend` | `004f69e` `55b37fc` `15aa9cd` `5257f89` `3fa732c` `8794f7b` | https://git.inshop.social/meri/inshop-app/compare/main...feature/e2e-real-backend |
| inshop-back-end | `feature/e2e-real-backend` | `6446ca1` `d68aa83` | https://git.inshop.social/Mohsen/inshop-backend/compare/main...feature/e2e-real-backend |
| inshop-infrastructure | `feature/e2e-environment` | `410f3ec` | https://git.inshop.social/Mohsen/inshop-infrastructure/compare/main...feature/e2e-environment |

To pick it up: `git fetch gitea && git switch feature/e2e-real-backend` (or `feature/e2e-environment` for infra).

## What each branch adds

**Backend.** These E2E-only switches are refused on any `inshop.social` host unless one of its hostname labels starts with `e2e`. The check is `assertE2eOnlySettingsAreSafe()`, called first in `main.ts`.
- `SMS_TRANSPORT=capture`: no SMS is sent. The OTP stays in the `verification` table, where the tests read it.
- `DB_SCHEMA_SYNC=true`: builds tables from the entities. The migrations can't build a fresh DB.
- `AUTH_RATE_LIMIT_MAX`: raises Better Auth's per-IP limits for `/sign-in/*` and `/phone-number/*`.
- `RATE_LIMIT_PER_MINUTE`: the global throttler. Default 100.

**App**
- Runtime URLs: `/runtime-config.js` serves `PUBLIC_API_URL` and `PUBLIC_CDN_URL` from the container's environment. Unset, it falls back to `NEXT_PUBLIC_*`. This lets one image be promoted between environments.
- Suite `e2e-real/`: Playwright against a real backend, on the chromium and mobile-chrome projects.
  - `tests/auth/sign-up.spec.ts` (2 tests);
  - `tests/auth/sign-in.spec.ts` (3 tests: sign in and reload, wrong password, logout);
  - `tests/seller/apply.spec.ts` (3 tests: a signed-in user applies and becomes a seller, applying before sign-up makes the new account a seller, a duplicate phone gets 409).
  - Total: 16 tests (8 per project).
- `e2e-real/stack/`: a local throwaway stack. Run it with `npm run test:e2e:real`, options `BACKEND_DIR`, `KEEP_STACK=1` and `SKIP_BUILD=1`.
- `e2e-real/runner/`: a Playwright runner image for machines without Node (the E2E server, CI).

**Infra**
- `stacks/e2e-application.yml.j2`, `environments/e2e/backend.env`, `files/nginx/e2e/*.conf` and `playbooks/deploy-e2e-application.yml`.
- `make deploy-e2e-app ENV=production [E2E_RESET=false]`.
- Runs on the dev node only. By default every deploy starts from empty data.

## What is live

- https://e2e.inshop.social → `e2e_frontend`, and https://api.e2e.inshop.social → `e2e_backend`.
- Both run in swarm stack `e2e_application` on the dev node `94.184.32.144`, with network `inshop_e2e_application` (attachable).
- E2E credentials are generated on the server in `/srv/inshop/environments/e2e/secrets.env` (root, 0600) and never leave it.
- ArvanCloud has a bypass-cache rule for both hosts, set by the user. All URLs show `x-cache: BYPASS`.
- Last verified 2026-10-21: 3 runs × 16 tests, **48/48 passed**, about 30s per run.

## Setting up the new machine

1. **SSH alias:** add this to `~/.ssh/config`, using the same deploy key as the infra repo:
   ```
   Host inshop-e2e-dev
     HostName 94.184.32.144
     User deploy
     IdentityFile ~/.ssh/id_ed25519
     IdentitiesOnly yes
   ```
2. **For deploys:** you need Ansible plus the infra repo's vault password file. `make` expects `ENV=production`.
3. **For the local stack:** you need Docker. The cached `minio/minio:latest` and `minio/mc:latest` images are required, because Docker Hub no longer serves them. Override them with `MINIO_IMAGE` and `MINIO_MC_IMAGE`.
4. **npm:** use npm 10 for lockfiles (`npx npm@10.9.9 install ...`). npm 12 rewrites them.

## Running the tests against the live E2E environment

Run them on the dev node, not a laptop: through the VPN each request takes 1–2s. From the app repo root:

```bash
tar --exclude=e2e-real/stack -czf - tsconfig.json features e2e-real | ssh inshop-e2e-dev '
  sudo rm -rf ~/e2e-runner && mkdir -p ~/e2e-runner && tar -C ~/e2e-runner -xzf - && cd ~/e2e-runner &&
  docker build -q -f e2e-real/runner/Dockerfile -t inshop-e2e-runner:e2e . &&
  sudo bash -c "set -a; . /srv/inshop/environments/e2e/secrets.env; set +a;
    docker run --rm --shm-size=1g --network inshop_e2e_application \
      -e E2E_BASE_URL=https://e2e.inshop.social -e E2E_API_URL=https://api.e2e.inshop.social \
      -e E2E_DATABASE_URL=postgres://inshop_e2e:\${POSTGRES_PASSWORD}@e2e_postgres:5432/inshop_e2e \
      inshop-e2e-runner:e2e"'
```

To run one spec, add Playwright arguments after the image name, e.g. `inshop-e2e-runner:e2e tests/seller`.

## Redeploying the E2E environment with new code

The images aren't in the registry. They're built locally and loaded straight onto the dev node; registry credentials were never used.

```bash
# backend (from the inshop-back-end branch)
docker build -t inshop-e2e-backend:e2e .

# frontend (from the inshop-app branch)
docker build -t inshop-e2e-frontend:e2e \
  --build-arg APP_ENV=e2e --build-arg NEXT_PUBLIC_APP_ENV=e2e \
  --build-arg NEXT_PUBLIC_APP_URL=https://e2e.inshop.social \
  --build-arg NEXT_PUBLIC_API_URL=https://api.e2e.inshop.social \
  --build-arg NEXT_PUBLIC_CDN_URL=https://api.e2e.inshop.social/inshop-e2e-uploads \
  --build-arg NEXT_PUBLIC_GLITCHTIP_DSN= --build-arg GLITCHTIP_DSN= \
  --build-arg NEXT_PUBLIC_GA_ID= --build-arg NEXT_PUBLIC_GTM_ID= .

# load onto the dev node (~1.6 GB; only the changed images are needed)
docker save inshop-e2e-backend:e2e inshop-e2e-frontend:e2e | gzip -1 | ssh inshop-e2e-dev 'gunzip | sudo docker load'

# deploy (from the inshop-infrastructure branch)
make deploy-e2e-app ENV=production
```

## Open decisions (yours)

1. **Silent drop of duplicate Instagram handles** (backend bug). A second application with a used `instagramId` gets "success" in the UI. The queue job then throws and the application is never saved. Fix it? (yes/no)
2. **Nginx role reload bug.** `platform_nginx` has an empty `/var/run/nginx.pid`, so `nginx -s reload` fails. The E2E playbook works around it with `docker kill -s HUP`; your own Nginx role has the same bug. Fix it? (yes/no)
3. **Merging the three feature branches.** Nothing is merged yet.

## Next steps (in order)

1. **Next test (not started; you asked to hold it):** a new seller completes the shop profile at `/app/profile/edit`, and it shows on `/[handle]`. `pages/ProfileEditPage.ts` already exists for it.
2. **Post tests:**
   - create a post with a real tus upload to MinIO, and it appears in pending;
   - an admin approves it (make the user admin with `UPDATE "user" SET "isAdmin" = true`), and it shows in the feed, on `/p/[id]` and on `/[handle]` with its images.
3. **Service worker:** `app/sw.ts` hardcodes the API hostnames. Add `api.e2e.inshop.social`, or match `api.*`, so API calls are never cached.
4. **CI:** build → deploy-e2e → run the runner image → deploy. Move `dev-latest` only after a pass, and promote the tested image instead of rebuilding.
5. **Later:** an `e2e-main` environment.

## Housekeeping found along the way

- `inshop-app/.npmrc` has a commented-out Verdaccio `_auth` credential. Rotate it and remove it.
- `inshop-infrastructure/files/scripts/migrate-better-auth.sh` defaults to `dist/auth/...`, but the build output is `dist/src/auth/...`. It also uses the deprecated `@better-auth/cli@1.4.21`, which needs `--legacy-peer-deps` and must run from `/tmp`.
- Turn on ParsPack auto-renew. On 2026-10-21 an unpaid bill suspended the servers and production was down for about 4h.
- Set up Uptime Kuma alerts.
- The backend's `tsc --noEmit` has existing errors in spec/e2e files on `develop`. They're not from this work.

## Gotchas

- The app lints with **Biome** (`npm run lint`), not ESLint. Pre-push (Lefthook) runs lint, then unit tests, then build.
- MinIO rejects hostnames with underscores, so the stack uses the alias `e2e-minio`.
- Test data must be unique per test: `uniquePhone()` (`0999…`), `uniqueNationalId()` and `uniqueInstagramId()`. The DB is shared and never cleaned between runs.
- Seller applications are queued (BullMQ). Wait with `db.waitForSellerApplication(phone)` or a `toPass` reload loop.
- The backend worktree has untracked `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Leave them alone.
- Never run `docker swarm init --force-new-cluster`.
