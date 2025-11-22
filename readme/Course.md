# Course API Documentation

This document describes the Course endpoints, controller behavior, service validation, file upload flow (GCS), and recommended improvements.

Files involved

- `routes/courseRoute.js` — route definitions, multer middleware for uploads
- `controllers/courseController.js` — handles upload to GCS and calls service
- `services/courseService.js` — Prisma-based business logic and validations
- `utils/gcsService.js` — Google Cloud Storage bucket helper used by controller

Mounting

Add to `index.js` to expose endpoints:

```js
import courseRoutes from "./routes/courseRoute.js";
app.use("/api/course", courseRoutes);
```

Endpoints

1. POST `/api/course/add`

- Purpose: Create a new course and upload an optional media file (image/video).
- Content-Type: `multipart/form-data`
- Fields:
  - `course` (File) — optional; allowed extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.mp4`, `.mkv`
  - `title` (string) — required
  - `courseCategoryId` (string, uuid) — required
  - `ageRange` (string) — optional
  - `description` (string) — optional
  - `isActive` (boolean) — optional
  - `createdBy` (string) — optional

Behavior / Notes:

- The route uses multer memory storage and a fileFilter allowing images and video file extensions.
- If `req.file` is present, controller uploads the file buffer to Google Cloud Storage at path `courses/{filename}` and makes the file public.
- Controller sets `req.body.mediaUrl = publicUrl` and `req.body.mediaType = req.file.mimetype` prior to calling `createCourse` in service.
- The service requires `title`, `courseCategoryId`, `mediaUrl`, and `mediaType` — so a file must be present for create to succeed. If you want media to be optional, update service validation.

2. GET `/api/course/get`

- Purpose: Return all courses ordered by `createdAt` ascending. Includes related `courseCategory` and `classes` in the response.

3. GET `/api/course/get/:id`

- Purpose: Return a single course by id, including `courseCategory` and `classes`.

4. PUT `/api/course/update/:id`

- Purpose: Update a course record; supports optional new file upload (same file rules as create).
- Behavior: controller uploads new file (if provided), sets `mediaUrl` and `mediaType` on the body, and calls `updateCourse`.

5. DELETE `/api/course/delete/:id`

- Purpose: Delete course by id.

Service validation and behavior

- Required fields for create/update: `title`, `courseCategoryId`, `mediaUrl`, `mediaType`.
  - Currently the service enforces media presence (mediaUrl/mediaType) — this means API consumers must upload a file when creating or updating.
- `createCourse` and `updateCourse` include related `courseCategory` and `classes` in the response using Prisma `include`.
- `getAllCourses` and `getCourseById` return `courseCategory` and `classes` via `include`.

Prisma model (expected)

The `Course` model in `schema.prisma` should resemble:

```prisma
model Course {
  id               String   @id @default(uuid())
  title            String   @db.VarChar(255)
  description      String?  @db.Text
  courseCategoryId String
  ageRange         String?  @db.VarChar(50)
  mediaUrl         String?  @db.VarChar(500)
  mediaType        String?  @db.VarChar(50)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  createdBy        String?  @db.VarChar(255)
  updatedBy        String?  @db.VarChar(255)

  // relations
  classes          Class[]
  CourseCategory   CourseCategory @relation(fields: [courseCategoryId], references: [id])
}
```

Important implementation notes & potential bugs

- Controller sets `req.body.mediaType = req.file.mimetype` without checking if `req.file` exists; this will throw if no file is uploaded. Ensure controller checks `if (req.file)` before accessing `req.file.mimetype`.
- Service requires `mediaUrl` and `mediaType` — if you want file to be optional, relax validation or derive `mediaType`/`mediaUrl` differently.
- When uploading to GCS, filenames are used directly; consider sanitizing or generating unique filenames (e.g., prefix with timestamp or UUID) to avoid collisions.
- Controller uses `bucket.file(logoPath).makePublic()` — this makes files publicly accessible. If you prefer signed URLs or private storage, change this behavior.

File upload security and processing

- Allowed extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.mp4`, `.mkv` (configured in route file).
- File is uploaded from memory buffer to GCS with `resumable: false` — this is fine for small files, but for larger videos consider streaming/resumable uploads.
- Validate file size in multer config to prevent very large uploads (`limits: { fileSize: <bytes> }`).

Examples

Create (multipart/form-data with file) - curl

```bash
curl -X POST http://localhost:9000/api/course/add \
  -F "course=@./media/video.mp4" \
  -F "title=Intro to Guitar" \
  -F "courseCategoryId=<category-id>" \
  -F "description=Beginner course"
```

Create (fetch + FormData) - Node/browser

```js
const form = new FormData();
form.append("course", fileInput.files[0]);
form.append("title", "Intro to Piano");
form.append("courseCategoryId", "<category-id>");

const res = await fetch("http://localhost:9000/api/course/add", {
  method: "POST",
  body: form,
});
const json = await res.json();
```

Get all:

```bash
curl http://localhost:9000/api/course/get
```

Update (multipart/form-data with optional new file):

```bash
curl -X PUT http://localhost:9000/api/course/update/<id> \
  -F "course=@./media/new.jpg" \
  -F "title=Updated Title" \
  -F "courseCategoryId=<category-id>"
```

Delete:

```bash
curl -X DELETE http://localhost:9000/api/course/delete/<id>
```

Error responses

- Service functions return `{ success: false, message, error? }` and controllers map these to HTTP statuses:
  - 200 on success
  - 400 for validation failures
  - 404 for not-found
  - 500 for server errors
