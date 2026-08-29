# Indian e-Visa — independent redesign prototype

A complete proof of concept for a calmer, application-centred Indian e-Visa experience. It combines a React interface and Hono API in one Cloudflare Workers project, with persistent D1 records and R2-backed demonstration uploads.

> Independent redesign prototype. Not an official Government of India service. All people, documents, decisions, fees, entry points and support details are fictional demonstration data. No real government, immigration, passport, payment or email APIs are used.

## Stack

- TypeScript, React, Vite and React Router
- Tailwind CSS with a small editorial design system
- Cloudflare Workers and Hono
- Cloudflare D1 for application data
- Cloudflare R2 for demonstration uploads
- Zod validation and Vitest business-logic tests

The frontend static assets and Worker API deploy together. All server endpoints live below `/api`; the Worker accesses D1 and R2 through native bindings. The project requires no `DATABASE_URL`, traditional database server or third-party backend.

## Local setup

Requirements: Node.js 20 or newer and a free Cloudflare account.

```bash
npm install
npx wrangler login
npx wrangler d1 create india-evisa --location apac
npx wrangler r2 bucket create india-evisa-documents
```

Copy the `database_id` returned by the D1 create command into `wrangler.jsonc`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`. The `DB` and `DOCUMENTS` binding names must remain unchanged.

Prepare and seed the local database:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Wrangler provides local D1 and R2 persistence. Refreshing or restarting the browser does not discard saved application state.

## Deploy to Cloudflare

Apply the schema and fictional seed records to the remote D1 database, then deploy the Worker and static assets:

```bash
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
```

The generated `workers.dev` URL is sufficient; no custom domain or paid service is required. The APAC location hint is selected when the database is created. This prototype is designed to remain comfortably within Cloudflare's Free-plan limits by using compact autosave patches, purpose-built dashboard queries, indexes and D1 batch writes.

## Demo records

Use the application ID, passport number and date of birth together on **Find application** or **Payment verification**.

| Applicant | Application ID | Passport | Date of birth | State |
|---|---|---|---|---|
| Maya Thompson | `IND-EV-26-DEMO01` | `P1234567` | `1996-08-14` | Draft |
| Daniel Weber | `IND-EV-26-DEMO02` | `C01X8831` | `1988-02-19` | Payment pending |
| Sophie Martin | `IND-EV-26-DEMO03` | `22FV61948` | `1992-11-03` | Under review |
| Kenji Sato | `IND-EV-26-DEMO04` | `TR4901812` | `1985-05-22` | Document replacement |
| Amelia Wilson | `IND-EV-26-DEMO05` | `N8406713` | `1990-07-10` | Granted with ETA |
| Omar Al Mansoori | `IND-EV-26-DEMO06` | `A7843021` | `1983-12-04` | Decision made |

The `/demo` page contains the same fictional references. The admin portal at `/admin` uses the visible mock identity `Visa Review Officer — demo-admin@gov.example`; its server mutation boundary is intentionally simple and suitable only for this demonstration.

## Architecture

```text
Browser
  ├─ React Router application workspace
  └─ /api requests
        ↓
Cloudflare Worker / Hono
  ├─ D1: applications, sections, documents, payments, events,
  │      notifications, ETAs and reference data
  └─ R2: fictional upload objects under server-generated keys
```

Application form sections are stored independently, so the 600 ms autosave sends only the current changed section. Server validation, prepared statements and indexed lookup fields protect every persistence path. Multi-record status changes such as document replacement requests and grants use D1 batches.

## Useful commands

```bash
npm run typecheck
npm test
npm run build
npm run db:migrate
npm run db:seed
```

Only fictional files should be uploaded. The application accepts PDF, JPG and PNG demonstration documents up to 10 MB, passes them through the Worker, generates the R2 key server-side and stores only metadata in D1.
