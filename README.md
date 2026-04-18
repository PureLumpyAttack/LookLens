# LookLens

**See it, scan it, wear it.**

LookLens is a hackathon project about _empowering women_. In specific, pushing back on the financially exploitative side of the beauty industry. LookLens lets you upload a photo, pick a look, and see an AI-generated preview of that makeup on _you_ — before a single product hits your cart. The goal: fewer impulse buys, fewer half-used palettes in a drawer, more confident choices about what's actually worth your money.

## How it works

Upload a photo, pick a template, and LookLens runs a Google GenAI pipeline to render the styled look on your face.

![Research pipeline](/assets/pipeline.svg)

## Stack

- **Next.js 16** (App Router) + React 19
- **Clerk** for auth
- **Drizzle ORM** + Neon (Postgres)
- **UploadThing** for image uploads
- **Google GenAI** (`@google/genai`) for the makeup pipeline
- **Tailwind v4** + shadcn / Base UI components

## Getting started

```bash
pnpm install
pnpm dev           # or: pnpm dev:https
```

Open http://localhost:3000.

### Environment

Create `.env.local` with at minimum:

```
# Recommended for most uses
DATABASE_URL=

# For uses requiring a connection without pgbouncer
DATABASE_URL_UNPOOLED=

# Parameters for constructing your own connection string
PGHOST=
PGHOST_UNPOOLED=
PGUSER=
PGDATABASE=
PGPASSWORD=

# Parameters for Vercel Postgres Templates
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
POSTGRES_URL_NO_SSL=
POSTGRES_PRISMA_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Encryption (generate with OpenSSH)
ENCRYPTION_KEY=

# File Uploads
UPLOADTHING_TOKEN=

# Brain of the process
GEMINI_API_KEY=
```

### Database

```bash
pnpm db:generate   # create migrations from schema changes
pnpm db:migrate    # apply migrations
pnpm db:studio     # browse the DB
```

Schema lives in `lib/db/schema.ts`; migrations in `drizzle/`.

## Layout

```
app/
  (auth)/              sign-in / sign-up routes
  (pwa)/               PWA shell
  api/uploadthing/     upload route handler
  dashboard/
    makeup/[templateId]/
    onboarding/
lib/
  makeup-pipeline.ts   AI Research pipeline
  db/                  drizzle client + schema
  auth.ts, encryption.ts, uploadthing.ts
```
