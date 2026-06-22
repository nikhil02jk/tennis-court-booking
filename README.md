# CourtTime

Local-first tennis court booking prototype with optional Neon Auth and Neon Data API storage for bookings and court reviews.

## Run locally

```bash
npm install
npm run dev -- --port 5173
```

## Enable Neon Auth, bookings, and reviews

1. Create or open a Neon project.
2. Enable Neon Auth in the Neon Console.
3. Enable the Data API for the same branch/database and select Neon Auth as the auth provider.
4. Run the migrations in the Neon SQL editor:
   - `db/migrations/001_neon_auth_bookings.sql`
   - `db/migrations/002_court_reviews.sql`
5. Copy `.env.example` to `.env` and fill in:

```bash
VITE_NEON_AUTH_URL=https://your-neon-auth-endpoint/neondb/auth
VITE_NEON_DATA_API_URL=https://your-neon-data-api-endpoint/rest/v1
```

6. Refresh the Data API schema cache.
7. Restart the Vite dev server.

Without those env vars, the app stays usable with local demo bookings and reviews.
