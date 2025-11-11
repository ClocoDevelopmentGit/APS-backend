import cron from "node-cron";
import { syncGooglePlaceReviews } from "../services/testimonialService.js";

cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("🕛 Running daily Google review sync (IST)...");
    try {
      await syncGooglePlaceReviews();
    } catch (err) {
      console.error("Cron job failed:", err.message);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);
