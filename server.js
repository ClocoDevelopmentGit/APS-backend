import "dotenv/config";
import app from "./index.js";
app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(
    `Server is running on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});
