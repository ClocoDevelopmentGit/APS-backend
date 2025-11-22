# Testimonial (Google Place Reviews) Service

This document explains how the Testimonial (Google Place Reviews) integration works, the files involved, required environment variables, how to trigger the sync and how to expose the stored reviews via the API.

Files

- `services/testimonialService.js` — syncs Google Place reviews and reads stored reviews from the DB
- `controllers/testimonialController.js` — controller that returns reviews from DB
- `routes/testimonialRoute.js` — router exposing the GET `/get` endpoint

Purpose

- Fetch reviews from Google Places (Place Details API) for the configured place ID, normalize and store them in the `googleReview` table.
- Provide an endpoint to read the stored reviews for frontend consumption.

Environment variables

- `GOOGLE_API_KEY` — API key with access to Google Places APIs
- `GOOGLE_PLACE_ID` — the place identifier to fetch reviews for

Behavior (service)

- `syncGooglePlaceReviews()`

  - Builds a Places API URL using `GOOGLE_API_KEY` and `GOOGLE_PLACE_ID`.
  - Uses `axios.get` with a 10s timeout and retry logic (3 attempts, 2s wait between retries).
  - Filters out empty reviews, sorts by publish time (newest first), and maps each review into the DB shape:
    - `reviewerName`
    - `reviewText`
    - `reviewDate` (Date)
    - `createdBy` (set to `system`)
  - If there are reviews, the service deletes all existing rows in `googleReview` and inserts the fresh list using `createMany`.
  - Logs count of synced reviews or errors.

- `getGoogleReviewsFromDB()`
  - Reads from the `googleReview` table ordered by `reviewDate` desc and returns a lightweight projection:
    - `id`, `reviewerName`, `reviewText`, `reviewDate`

Notes on implementation details

- `dns.setDefaultResultOrder('ipv4first')` is used to prefer IPv4 resolution for outgoing requests — this can help avoid IPv6 connectivity issues in some environments.
- The service currently wipes the `googleReview` table and repopulates it on every successful sync. This is simple and works for small volumes, but if you want incremental updates or preservation of local edits, consider implementing an upsert strategy.
- `createMany` does not run Prisma model hooks — if you rely on them, change to `create` or `upsert` per item.

Expected database model (prisma)

The service expects a `googleReview` model with fields similar to the example below. If this model does not exist in your `schema.prisma`, add it and run `npx prisma generate` and `npx prisma migrate dev`.

```prisma
model GoogleReview {
  id           String   @id @default(uuid())
  reviewerName String
  reviewText   String   @db.Text
  reviewDate   DateTime
  createdBy    String?  @db.VarChar(255)
  createdAt    DateTime @default(now())
}
```

Exposing reviews via API

- `routes/testimonialRoute.js` defines `GET /get` and the controller `fetchPlaceDetails` which calls `getGoogleReviewsFromDB()` and returns JSON `{ success: true, result }`.
- Mount the route in your main `index.js` (example):

```js
import testimonialRoutes from "./routes/testimonialRoute.js";
app.use("/api/testimonial", testimonialRoutes);
```

Testing the endpoint

1. Start the server (see root `README.md` for run commands).
2. Call the endpoint (example):

```bash
curl http://localhost:9000/api/testimonial/get
```

The response will look like:

```json
{
  "success": true,
  "result": [
    {
      "id": "uuid",
      "reviewerName": "Alice",
      "reviewText": "Great place!",
      "reviewDate": "2025-11-20T..."
    }
  ]
}
```

Triggering a sync

- The service offers the `syncGooglePlaceReviews()` function in `testimonialService.js`. You can call this function manually from a script, or schedule it.

Example one-off script (scripts/syncReviews.js):

```js
import { syncGooglePlaceReviews } from "../services/testimonialService.js";

syncGooglePlaceReviews()
  .then(() => process.exit())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

Scheduling syncs (recommended)

- Use `node-cron`, `agenda`, or a hosted scheduler (Cloud Scheduler) to run periodic syncs (e.g., every 6 hours).

Example using `node-cron`:

```js
import cron from "node-cron";
import { syncGooglePlaceReviews } from "./services/testimonialService.js";

// Run every 6 hours
cron.schedule("0 */6 * * *", () => {
  syncGooglePlaceReviews();
});
```

Error handling & observability

- Network errors and timeouts are retried up to 3 times — transient errors are handled gracefully.
- All errors are logged to console; consider integrating a proper logger (Winston, pino) and sending critical failures to an alerting system.
- If the sync fails repeatedly, the DB retains the last successful snapshot (because deletion occurs only when new reviews are created). If you prefer atomic behavior, wrap delete+create in a transaction.

Security and quota considerations

- Keep `GOOGLE_API_KEY` secret; do not commit it into source control.
- Google Places API has usage quotas and billing — monitor usage and implement caching / rate limiting as needed.
