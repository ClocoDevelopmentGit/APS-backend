import { Storage } from "@google-cloud/storage";
const key = JSON.parse(
  Buffer.from(process.env.GCP_KEYFILE_BASE64, "base64").toString()
);

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: key,
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);

export default bucket;
