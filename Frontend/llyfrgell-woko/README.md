## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local Database

The local development environment reads `DATABASE_URL` from `.env.local`. Start Postgres with Podman from this directory:

```bash
podman compose up -d
```

Stop the container while preserving its data volume with:

```bash
podman compose down
```

The container starts with an empty database. Apply the checked-in schema migrations to the local database with:

```bash
npm run db:migrate:local
```

Create a new SQL migration with:

```bash
npm run db:migration:create -- add_a_short_description
```

Each SQL migration has `-- Up Migration` and `-- Down Migration` sections. Apply new migrations locally before using the app. Production migrations are a separate, deliberate operation; do not run the initial baseline against the existing hosted database. Its schema must first be verified against the baseline and recorded as already applied.

## Objective
To create an clean and accessible means of keeping track of your reading backlog and history. 

