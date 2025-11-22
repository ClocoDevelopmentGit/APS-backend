# Course Category (API) Documentation

This document describes the Course Category endpoints, controllers, and service logic currently implemented in the repository.

Files

- `routes/categoryRoute.js` — Express routes
- `controllers/categoryController.js` — request handlers and response mapping
- `services/categoryService.js` — Prisma-based business logic and validations

```js
import categoryRoutes from "./routes/categoryRoute.js";
app.use("/api/category", categoryRoutes);
```

Endpoints

1. POST `/api/category/add`

- Purpose: Create a new course category.
- Content-Type: `application/json`
- Body (JSON):
  - `name` (string) — required
  - `description` (string) — optional
  - `isActive` (boolean) — optional
  - `createdBy` (string) — optional

Server behavior:

- Validates that `name` is present.
- Checks for existing category with same name (case-insensitive). If found, returns `{ success: false, message: "Category name already exists" }`.
- Creates the `courseCategory` row and returns `{ success: true, category }`.

Example (curl):

```bash
curl -X POST http://localhost:9000/api/category/add \
  -H 'Content-Type: application/json' \
  -d '{"name":"Kids Programs","description":"Courses for kids"}'
```

2. GET `/api/category/get`

- Purpose: Return all categories ordered by `createdAt` ascending.
- Response: `{ success: true, category: [ ... ] }` or `{ success: false, message: "No categorys found" }` when empty.

Note: The service currently returns the plural field name `category` (singular) — consider renaming to `categories` for clarity.

3. GET `/api/category/get/:id`

- Purpose: Return a single category by `id`.
- If `id` is missing or category is not found returns `{ success: false, message: "id is required" }` or `{ success: false, message: "Category not found" }` respectively.

4. PUT `/api/category/update/:id`

- Purpose: Update an existing category.
- Required body fields: `name` (the service validates `name` presence).
- Server behavior:
  - Verifies the category exists by `id`.
  - Checks for a case-insensitive duplicate `name` across categories; if found returns error "Category name already exists".
  - Performs update and returns `{ success: true, category }`.

5. DELETE `/api/category/delete/:id`

- Purpose: Delete a category by `id`.
- Server behavior: checks existence and then deletes; returns `{ success: true, message: "Category deleted successfully" }`.

Service Details (business rules)

- Name uniqueness

  - Duplicate detection uses `findFirst` with `mode: 'insensitive'` to ensure case-insensitive uniqueness.
  - The check is performed both on create and update.

- Ordering and empty results
  - `getAllCategories` returns results ordered by `createdAt: 'asc'`.
  - If no categories exist, the service returns success=false and message "No categorys found" (typo: consider fixing to "No categories found").

Prisma model

The code operates on the `CourseCategory` model which in `schema.prisma` is defined similarly to:

```prisma
model CourseCategory {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(100)
  description String?  @db.Text
  ageRange    String?  @db.VarChar(50)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?  @db.VarChar(255)
  updatedBy   String?  @db.VarChar(255)

  @@index([isActive])
}
```

Validation & error handling

- The service returns structured objects: `{ success: boolean, category? , message?, error? }`.
- Controllers map service responses to HTTP statuses:
  - 200 on success
  - 400 for validation errors on create/update
  - 404 for not-found on get/delete
  - 500 for unexpected server errors

Observations & recommended fixes

- Typo and pluralization: messages and response keys contain typos (`categorys`) and singular/plural inconsistencies (`category` vs `categories`). Standardize these to improve API ergonomics.
- Duplicate name check on update: current code checks for any category with the same name, but does not exclude the current record by id — this will block updating the category without changing the name. Modify the check to exclude the current id when validating uniqueness on update.

  Example fix for update duplicate check (pseudo-code):

  ```js
  const categoryNameCheck = await prisma.courseCategory.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      NOT: { id: id },
    },
  });
  ```

- Consider adding pagination and filtering to `getAllCategories` for large datasets.
- Add request body validation middleware (e.g., `express-validator` or `zod`) to move validation out of service layer and keep consistent error responses.
- Add integration tests for the full CRUD flow.

Examples

Create (fetch example):

```js
const res = await fetch("http://localhost:9000/api/category/add", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Arts", description: "Arts courses" }),
});
const json = await res.json();
```

Get all:

```js
const res = await fetch("http://localhost:9000/api/category/get");
const json = await res.json();
```

Update:

```js
const res = await fetch("http://localhost:9000/api/category/update/<id>", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "New Name", isActive: true }),
});
```

Delete:

```js
const res = await fetch("http://localhost:9000/api/category/delete/<id>", {
  method: "DELETE",
});
```
