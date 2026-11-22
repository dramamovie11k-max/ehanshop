# Ehanshop

[Live storefront](https://ehanshop.pages.dev/)

## Development

This project runs on Cloudflare Pages Functions, D1, R2 and custom JWT.
Use Node 24 and npm:

```sh
npm ci
npm run setup:local
npm run build
npm run dev:api
```

For frontend hot reload, run `npm run dev` in a second terminal. Vite proxies
API requests to the Pages Functions server. See [Cloudflare setup](docs/cloudflare.md)
for bindings, schema, authentication, admin enrollment and validation commands.

The complete new-database schema is [cloudflare/schema.sql](cloudflare/schema.sql).
Existing databases must use the incremental migration runner described in the docs.
