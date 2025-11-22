# Class API

This document describes the Class CRUD API implemented under `routes/classRoute.js` and the related controller/service logic in `controllers/classController.js` and `services/classService.js`.

**Overview**

- **Purpose:** Manage scheduled class instances tied to courses, terms, locations, tutors, and fees.
- **Key files:** `routes/classRoute.js`, `controllers/classController.js`, `services/classService.js`

**Routes**

- `POST /api/class/add` : Create a new class.
- `GET  /api/class/get` : Retrieve all classes (ordered by `createdAt` asc).
- `GET  /api/class/get/:id` : Retrieve a single class by `id`.
- `PUT  /api/class/update/:id` : Update a class by `id`.
- `DELETE /api/class/delete/:id` : Delete a class by `id`.

**Controller behavior**

- Controllers call corresponding service functions and map service results to HTTP responses:
  - On success: returns `200` with `{ success: true, ... }` (or `200` for deleted item).
  - On client error: returns `400` or `404` with `{ success: false, message }`.
  - On server error: returns `500` and logs the error.

**Service contract & validations**

- `createClass(data)`

  - Required fields checked: `courseId, termId, locationId, tutorId, day, startDate, endDate, startTime, endTime, room, availableSeats`.
  - If any required field is missing, returns `{ success: false, message: "<field> is required" }`.
  - Date/time parsing: `startDate`, `endDate`, `startTime`, `endTime` are converted with `new Date(...)` before saving.
  - `availableSeats` is cast to `Number`.
  - On success returns `{ success: true, class: <createdClass> }` including relations: `course, term, location, tutor, fees`.

- `getAllClasses()`

  - Returns `{ success: true, classes }` where each class includes relations `course, term, location, tutor, fees`.
  - If no classes exist returns `{ success: false, message: "No classes found" }`.

- `getClassById(id)`

  - If `id` missing returns `{ success: false, message: "id is required" }`.
  - If not found returns `{ success: false, message: "Class not found" }`.
  - On success returns `{ success: true, class }` with relations.

- `updateClass(id, data)`

  - Checks that `id` exists; returns error if missing or not found.
  - Only updates fields provided; date/time fields are conditionally converted when present.
  - `availableSeats` is updated only if provided; accepts `0`.
  - On success returns `{ success: true, class: <updatedClass> }`.

- `deleteClass(id)`

  **Tiny controller snippet**

  ```js
  // controllers/classController.js (mini)
  export const createClassController = async (req, res) => {
    try {
      const r = await createClass(req.body);
      return r.success ? res.json(r) : res.status(400).json(r);
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  };
  ```

  **Tiny service snippet**

  ```js
  // services/classService.js (mini)
  const required = {
    courseId,
    termId,
    locationId,
    tutorId,
    day,
    startDate,
    endDate,
    startTime,
    endTime,
    room,
    availableSeats,
  };
  for (const k in required)
    if (!required[k]) return { success: false, message: `${k} is required` };
  // ... then create with prisma.class.create({ data: { /* fields */ } })
  ```

  **Short HTTP examples**

  Create (minimal):

  ```bash
  curl -X POST http://localhost:3000/api/class/add -H "Content-Type: application/json" -d '{"courseId":"<id>","availableSeats":25}'
  ```

  Get all (minimal):

  ```bash
  curl http://localhost:3000/api/class/get
  ```

  PowerShell one-liner (minimal):

  ```powershell
  Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/class/add" -ContentType "application/json" -Body '{"courseId":"<id>"}'
  ```

  const classDetails = await prisma.class.create({
  data: {
  courseId,
  termId,
  locationId,
  tutorId,
  day,
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  startTime: new Date(startTime),
  endTime: new Date(endTime),
  room,
  notes,
  availableSeats: Number(availableSeats),
  createdBy,
  isActive: isActive ?? true,
  },
  include: {
  course: true,
  term: true,
  location: true,
  tutor: true,
  fees: true,
  },
  });

  return { success: true, class: classDetails };
  };

export const getAllClasses = async () => {
const classes = await prisma.class.findMany({
orderBy: { createdAt: "asc" },
include: {
course: true,
term: true,
location: true,
tutor: true,
fees: true,
},
});

if (!classes.length) return { success: false, message: "No classes found" };
return { success: true, classes };
};

````

**HTTP examples (curl / PowerShell)**

Create a class (JSON payload):

```bash
curl -X POST "http://localhost:3000/api/class/add" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId":"<course-uuid>",
    "termId":"<term-uuid>",
    "locationId":"<location-uuid>",
    "tutorId":"<tutor-uuid>",
    "day":"Monday",
    "startDate":"2025-12-01",
    "endDate":"2026-02-28",
    "startTime":"2025-12-01T09:00:00.000Z",
    "endTime":"2025-12-01T11:00:00.000Z",
    "room":"A101",
    "availableSeats":25
  }'
````

Get all classes:

```bash
curl "http://localhost:3000/api/class/get"
```

Or using PowerShell's Invoke-RestMethod:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/class/add" -ContentType "application/json" -Body (@{
  courseId = '<course-uuid>'
  termId = '<term-uuid>'
  locationId = '<location-uuid>'
  tutorId = '<tutor-uuid>'
  day = 'Monday'
  startDate = '2025-12-01'
  endDate = '2026-02-28'
  startTime = '2025-12-01T09:00:00.000Z'
  endTime = '2025-12-01T11:00:00.000Z'
  room = 'A101'
  availableSeats = 25
} | ConvertTo-Json)
```
