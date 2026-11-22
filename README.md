# Remix of Drama Movie 3k of New Main File (57)

sajibenterprise.online
এই ওয়েবসাইট এর মত আমাকে একটা ইকমার্স ওয়েবসাট বানিয়ে দিবে
তবে এটার থেকে আমাদের অনেক অ্যাডভান্স ফিচার থাকবে
হোম পেজে অফার কাউন্ট ডাউন লাগবে না আমার ওয়েবসাইট এ

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shop-advance-craft.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6cb4ba39-2259-486a-800c-ba8a78f0f73f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Cloudflare Pages

Ehanshop uses the `ehanshop` Pages project, the D1 binding `DB`, and the
R2 binding `BUCKET`. The production JWT signing key is stored as the
Pages secret `AUTH_JWT_SECRET`.

Use [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
from the repository root. Wrangler 4.166.0 was used to validate these commands.

```sh
wrangler d1 migrations apply DB --local
npm run build:cf
wrangler pages dev dist --port 8788
```

For local authentication, set a separate `AUTH_JWT_SECRET` of at least 32
bytes in the ignored `.dev.vars` file, then restart Pages dev. For Vite hot
reload run `npm run dev` with Pages dev running on port 8788.

To release a change, build first, apply pending migrations to the production
D1 database, then deploy the Pages bundle directly.

```sh
npm run build:cf
wrangler d1 migrations apply DB --remote
wrangler pages deploy dist --project-name ehanshop --branch main
```

To add the first administrator, create an account through the store, then
update the corresponding `user_roles` row for its `auth_users.id` to
`admin` in D1. The production schema starts with an empty catalog.
Password recovery requires a private email delivery channel.

### Deploy from GitHub

Pushes to `main` trigger the **Deploy Cloudflare Pages** workflow. In this
repository's GitHub Settings → Secrets and variables → Actions, add
`CLOUDFLARE_API_TOKEN` as a repository secret and `CLOUDFLARE_ACCOUNT_ID` as
a repository variable or secret. Scope the token to the Cloudflare account
with Cloudflare Pages Edit and D1 Edit permissions. Add the credentials
directly in GitHub settings.

For the first deployment after adding credentials, open the workflow in
GitHub Actions and select **Run workflow** on `main`. Subsequent pushes to
`main` run it automatically. The workflow tests and builds the exact
checkout, applies pending D1 migrations, deploys the bundle to the existing
Pages project, and verifies the production health endpoint.
