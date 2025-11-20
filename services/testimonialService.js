import axios from "axios";
import { PrismaClient } from "@prisma/client";
import dns from "dns";

const prisma = new PrismaClient();

dns.setDefaultResultOrder("ipv4first");

export const syncGooglePlaceReviews = async () => {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID;
    if (!GOOGLE_API_KEY || !GOOGLE_PLACE_ID)
      throw new Error("Missing Google API credentials");

    const url = `https://places.googleapis.com/v1/places/${GOOGLE_PLACE_ID}?fields=displayName,rating,reviews&key=${GOOGLE_API_KEY}`;

    let response;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await axios.get(url, { timeout: 10000 });
        break;
      } catch (err) {
        if (attempt === maxRetries) throw err;
        console.warn(`Retry ${attempt}/${maxRetries} failed — retrying in 2s`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!response?.data?.reviews) {
      console.warn("No reviews found in response");
      return;
    }

    const formattedReviews =
      response.data.reviews
        ?.filter((r) => r.text?.text?.trim() !== "")
        ?.sort(
          (a, b) => new Date(b.publishTime || 0) - new Date(a.publishTime || 0)
        )
        ?.map((r) => ({
          reviewerName: r.authorAttribution?.displayName || "Anonymous",
          reviewText: r.text.text,
          reviewDate: new Date(r.publishTime),
          createdBy: "system",
        })) || [];

    if (formattedReviews.length > 0) {
      await prisma.googleReview.deleteMany({});
      await prisma.googleReview.createMany({ data: formattedReviews });
    }

    console.log(`Synced ${formattedReviews.length} Google reviews`);
  } catch (error) {
    console.error("Error syncing Google Place reviews:", error);
  }
};

export const getGoogleReviewsFromDB = async () => {
  try {
    const reviews = await prisma.googleReview.findMany({
      orderBy: { reviewDate: "desc" },
      select: {
        id: true,
        reviewerName: true,
        reviewText: true,
        reviewDate: true,
      },
    });
    console.log(reviews);
    return reviews;
  } catch (error) {
    console.error("Error fetching Google reviews from DB:", error.message);
    return [];
  }
};
