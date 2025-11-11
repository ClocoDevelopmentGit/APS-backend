import { getGoogleReviewsFromDB } from "../services/testimonialService.js";

export const fetchPlaceDetails = async (req, res) => {
  try {
    const result = await getGoogleReviewsFromDB();
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Error in Controller:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
