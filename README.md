# indian e-visa

yeah so this is an independent redesign prototype for an indian e-visa flow. its a react app + hono api in one cloudflare workers project, and it has d1 for the fake app data plus r2 for the fake uploads.

> important: this isnt an official government of india service. literally all of it is demo stuff — people, docs, decisions, fees, entry points, support details, all fake. it doesnt connect to real passport, immigration, payment, or email apis either.

## whats in here

- typescript, react, vite, react router
- tailwind with a small editorial design system
- cloudflare workers + hono
- d1 for application data
- r2 for demo uploads
- zod + vitest for validation and business logic tests

the frontend and api deploy together. api stuff lives under `/api` and the worker uses cloudflare bindings for d1 and r2, so nah theres no `DATABASE_URL`, normal database server, or random third-party backend to set up.

## run it locally

youll need node 20+ and a free cloudflare account.

```bash
npm install
npx wrangler login
npx wrangler d1 create india-evisa --location apac
npx wrangler r2 bucket create india-evisa-documents
```

when wrangler gives u the d1 `database_id`, put it in `wrangler.jsonc` where it says `REPLACE_WITH_YOUR_D1_DATABASE_ID`. leave the `DB` and `DOCUMENTS` binding names alone tho.

then set up the local data and start it:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

wrangler keeps local d1 and r2 data around, so refreshing or restarting the browser doesnt just delete ur application state.

## deploy it

first put the schema + fictional seed data in remote d1, then deploy everything:

```bash
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
```

the generated `workers.dev` url is enough, no custom domain or paid service needed. the d1 setup uses the apac location hint. this is also meant to stay comfortably in cloudflare's free plan with small autosave patches, targeted dashboard queries, indexes, and d1 batch writes.

## demo records

use the application id, passport number, and date of birth together in **find application** or **payment verification**.

| applicant | application id | passport | date of birth | state |
|---|---|---|---|---|
| Maya Thompson | `IND-EV-26-DEMO01` | `P1234567` | `1996-08-14` | draft |
| Daniel Weber | `IND-EV-26-DEMO02` | `C01X8831` | `1988-02-19` | payment pending |
| Sophie Martin | `IND-EV-26-DEMO03` | `22FV61948` | `1992-11-03` | under review |
| Kenji Sato | `IND-EV-26-DEMO04` | `TR4901812` | `1985-05-22` | document replacement |
| Amelia Wilson | `IND-EV-26-DEMO05` | `N8406713` | `1990-07-10` | granted with eta |
| Omar Al Mansoori | `IND-EV-26-DEMO06` | `A7843021` | `1983-12-04` | decision made |

the `/demo` page has the same fake references. `/admin` uses the visible mock identity `Visa Review Officer — demo-admin@gov.example`. the admin mutation boundary is intentionally simple cuz this is just a demo, not something to use for real access control.

## how its set up

```text
browser
  ├─ react router application workspace
  └─ /api requests
        ↓
cloudflare worker / hono
  ├─ d1: applications, sections, documents, payments, events,
  │      notifications, etas, and reference data
  └─ r2: fictional upload objects under server-generated keys
```

form sections save separately, so the 600 ms autosave only sends the part that changed. the server does validation, prepared statements, and indexed lookups on every persistence path. stuff that changes multiple records at once, like replacement requests or grants, uses d1 batches.

## useful commands

```bash
npm run typecheck
npm test
npm run build
npm run db:migrate
npm run db:seed
```

only upload fictional files pls. it accepts pdf, jpg, and png demo docs up to 10 mb, sends them through the worker, makes the r2 key server-side, and only keeps metadata in d1.
