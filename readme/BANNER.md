# Banner API Documentation

The Banner API provides CRUD operations with image upload to Google Cloud Storage.

## Features

- Image upload to Google Cloud Storage
- CRUD operations for banners
- Order-based display management
- File type validation

## Environment Setup

Required environment variables:

```bash
GCP_PROJECT_ID=                   # Google Cloud Project ID
GCP_KEYFILE_BASE64=              # Base64 encoded Google Cloud service account key
GCP_BUCKET_NAME=                  # Google Cloud Storage bucket name
```

## API Endpoints

### POST `/api/banner/add`

Creates a new banner with image upload.

- Method: `POST`
- Content-Type: `multipart/form-data`

Request body:

```
banner: File (image)     # Supported formats: .png, .jpg, .jpeg, .webp
title: String           # Required
subtitle: String        # Optional
button1Text: String     # Optional
button1Link: String     # Optional
button2Text: String     # Optional
button2Link: String     # Optional
order: Number          # Optional, for display ordering
```

Response:

```json
{
  "success": true,
  "banner": {
    "id": "uuid",
    "mediaUrl": "https://storage.googleapis.com/bucket-name/banners/title/image.jpg",
    "mediaType": "image/jpeg",
    "title": "Banner Title",
    "subtitle": "Optional subtitle",
    "button1Text": "Click Here",
    "button1Link": "https://example.com",
    "order": 1,
    "createdAt": "2025-11-05T..."
  }
}
```

### GET `/api/banner/get`

Retrieves all banners, ordered by the `order` field ascending.

Response:

```json
{
  "success": true,
  "banner": [
    {
      "id": "uuid",
      "mediaUrl": "https://storage.googleapis.com/...",
      "mediaType": "image/jpeg",
      "title": "Banner 1",
      "order": 1
    }
  ]
}
```

### GET `/api/banner/get/:id`

Retrieves a specific banner by ID.

Response:

```json
{
  "success": true,
  "banner": {
    "id": "uuid",
    "mediaUrl": "https://storage.googleapis.com/...",
    "mediaType": "image/jpeg",
    "title": "Banner Title"
  }
}
```

### PUT `/api/banner/update/:id`

Updates a banner with optional new image upload.

- Method: `PUT`
- Content-Type: `multipart/form-data`

Request body: Same as POST `/api/banner/add`

### DELETE `/api/banner/delete/:id`

Deletes a banner by ID.

Response:

```json
{
  "success": true,
  "message": "Banner deleted successfully"
}
```

## Error Handling

All endpoints return error responses in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {} // Additional error details (in development)
}
```

Common error cases:

- 400: Missing required fields (title, image for create/update)
- 404: Banner not found
- 415: Unsupported image format
- 500: Server error (GCS upload failure, database error)

## Image Upload Details

Image upload specifications:

- Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`
- Storage: Google Cloud Storage
- Path format: `banners/{title}/{filename}`
- Public URL format: `https://storage.googleapis.com/{bucket-name}/{path}`

## Example Usage

### Upload a banner (Node.js with FormData):

```javascript
const form = new FormData();
form.append("banner", imageFile);
form.append("title", "Summer Sale");
form.append("subtitle", "Up to 50% off");
form.append("button1Text", "Shop Now");
form.append("button1Link", "/sale");
form.append("order", "1");

const response = await fetch("http://localhost:9000/api/banner/add", {
  method: "POST",
  body: form,
});

const result = await response.json();
```

### Get all banners:

```javascript
const response = await fetch("http://localhost:9000/api/banner/get");
const { success, banner } = await response.json();

if (success) {
  banners.forEach((banner) => {
    console.log(`${banner.title}: ${banner.mediaUrl}`);
  });
}
```

## Database Schema

```prisma
model Banner {
  id          String   @id @default(uuid())
  mediaUrl    String   @db.VarChar(500)
  mediaType   String   @db.VarChar(50)
  title       String   @db.VarChar(200)
  subtitle    String?  @db.VarChar(500)
  button1Text String?  @db.VarChar(50)
  button1Link String?  @db.VarChar(500)
  button2Text String?  @db.VarChar(50)
  button2Link String?  @db.VarChar(500)
  order      Int?     @default(0)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  createdBy  String?  @db.VarChar(255)
  updatedBy  String?  @db.VarChar(255)
}
```

## Implementation Details

### File Upload (bannerController.js)

- Uses multer for multipart/form-data handling
- Validates file types before upload
- Stores files in GCS with public access
- Updates database with GCS public URL

### Data Operations (bannerService.js)

- CRUD operations via Prisma ORM
- Validation for required fields
- Error handling with descriptive messages
- Order-based retrieval for listing

### Route Setup (bannerRoute.js)

- Express router configuration
- Multer middleware for file uploads
- Route-specific error handling
