import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 24 * 60 * 60 });

export const getGooglePlaceDetails = async () => {
  try {
    const cacheKey = "google_place_details";
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID;
    const url = `https://places.googleapis.com/v1/places/${GOOGLE_PLACE_ID}?fields=displayName,rating,reviews&key=${GOOGLE_API_KEY}`;
    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error(
        response.data.error_message || "Failed to fetch place details"
      );
    }

    const result = response.data;
    const formattedResult = {
      ...result,
      reviews: result.reviews
        ?.filter((r) => r.text?.text?.trim() !== "")
        .map((r) => ({
          author: r.authorAttribution?.displayName,
          text: r.text.text,
        })),
    };

    cache.set(cacheKey, formattedResult);
    return formattedResult;
  } catch (error) {
    console.error("Error in Google Place Service:", error);
    throw new Error("Unable to fetch Google Place details");
  }
};
