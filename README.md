# DOYA Training Platform – Functional Prototype

This project bootstraps the Phase 1 functional surface of the DOYA operations app using Next.js 14, Tailwind CSS, and a lightweight in-memory dataset aligned with the product blueprint.

## Getting Started

```bash
pnpm install   # or npm/yarn
pnpm run dev   # start Next.js on http://localhost:3000
```

## Structure

- `app/` – App Router pages organised by feature (dashboard, dogs, clients, sessions, plans, tasks, media, billing, settings, audit).
- `components/` – Reusable layout and UI primitives.
- `lib/` – Data access helpers and shared domain types backed by a static mock dataset (`lib/mock-data.ts`).

## Notes

- All feature pages run on server components and hydrate lightweight client UI where required (navigation shell).
- Data is read-only in this prototype and powered by deterministic mock data; mutations/actions can be wired later to server actions or API routes.
- Tailwind uses DOYA design tokens for consistent styling; adjust values in `tailwind.config.ts` as design evolves.
- Locale switching, auth, and automation jobs are scaffold-ready but not yet wired in this initial functional pass.
