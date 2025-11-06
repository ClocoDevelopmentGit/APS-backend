# APS-backend Data Models

Express.js backend with Prisma ORM for Academic Program System (APS). This documentation covers the core data models and their relationships.

## Data Models Overview

The system is built around these core concepts:
- Terms (academic periods)
- Locations (teaching venues)
- Courses & Categories
- Classes (scheduled course instances)
- Events (workshops/special events)
- Users & Roles (students, tutors, admins)

## Core Models

### Term Model
Represents an academic term/semester:
```prisma
model Term {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(100)
  startDate DateTime @db.Date
  endDate   DateTime @db.Date
  isActive  Boolean  @default(false)
  classes   Class[]  // Related classes in this term
}
```
- Tracks active/inactive terms
- Links to classes scheduled within the term
- Indexed on active status and date range

### Location Model
Physical venues where classes and events take place:
```prisma
model Location {
  id           String   @id @default(uuid())
  name         String   @db.VarChar(200)
  addressLine1 String   @db.VarChar(500)
  addressLine2 String?  @db.VarChar(500)
  suburb       String   @db.VarChar(200)
  city         String   @db.VarChar(200)
  state        String   @db.VarChar(100)
  country      String   @default("Australia")
  postcode     String?  @db.VarChar(20)
  rooms        String[] @db.VarChar(100)
  isActive     Boolean  @default(true)
  
  // Relations
  classes      Class[]
  events       Event[]
}
```
- Complete address information
- Maintains list of available rooms
- Links to classes and events held at the location

### Course Category Model
Organizes courses into categories:
```prisma
model CourseCategory {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(100)
  description String?  @db.Text
  ageRange    String?  @db.VarChar(50)
  isActive    Boolean  @default(true)
  
  // Relations
  class       Course[]
}
```
- Groups related courses
- Optional age range specification
- Tracks active/inactive status

### Course Model
Defines a course offering:
```prisma
model Course {
  id               String   @id @default(uuid())
  title            String   @db.VarChar(255)
  description      String?  @db.Text
  courseCategoryId String   @default(uuid())
  isActive         Boolean  @default(true)
  
  // Relations
  classes        Class[]
  CourseCategory CourseCategory @relation(fields: [courseCategoryId], references: [id])
}
```
- Links to a course category
- Can have multiple scheduled classes
- Tracks active/inactive status

### Class Model
Scheduled instance of a course:
```prisma
model Class {
  id             String   @id @default(uuid())
  courseId       String   
  termId         String   
  locationId     String?  
  tutorId        String   
  day            String   @db.VarChar(20)
  startDate      DateTime @db.Date
  endDate        DateTime @db.Date
  startTime      DateTime @db.Time
  endTime        DateTime @db.Time
  timezone       String   @default("Australia/Melbourne")
  room           String?  @db.VarChar(100)
  notes          String?  @db.Text
  availableSeats Int?
  status         String   @db.VarChar(20)
  isActive       Boolean  @default(true)

  // Relations
  course   Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  term     Term      @relation(fields: [termId], references: [id], onDelete: Restrict)
  location Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)
  fees     Fee[]
  tutor    User      @relation(fields: [tutorId], references: [id])
}
```
- Links course, term, location, and tutor
- Scheduled with specific dates/times
- Tracks available seats and status
- Associated fees (one-to-many)

### Fee Model
Represents course fees:
```prisma
model Fee {
  id        String   @id @default(uuid())
  termFee   Decimal  @db.Decimal(10, 2)
  yearlyFee Decimal  @db.Decimal(10, 2)
  classId   String
  
  // Relations
  class     Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
}
```
- Term and yearly fee options
- Uses Decimal for precise monetary values
- Cascading delete with class

### Event Model
Special events or workshops:
```prisma
model Event {
  id             String   @id @default(uuid())
  locationId     String?
  title          String   @db.VarChar(255)
  description    String?  @db.Text
  canEnroll      Boolean  @default(true)
  startDate      DateTime @db.Date
  endDate        DateTime @db.Date
  startTime      DateTime @db.Time
  endTime        DateTime @db.Time
  timezone       String   @default("Australia/Melbourne")
  room           String?  @db.VarChar(100)
  notes          String?  @db.Text
  availableSeats Int?
  status         String   @db.VarChar(20)
  fees           Float
  
  // Relations
  location       Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)
}
```
- Similar to classes but standalone
- Optional location association
- Enrollment control
- Single fee amount

### User Model
System users (students, tutors, guardians):
```prisma
model User {
  id             String    @id @default(uuid())
  userId         String    @unique
  firstName      String    @db.VarChar(255)
  lastName       String    @db.VarChar(255)
  email          String    @unique
  phone          String?   @db.VarChar(20)
  dob            DateTime? @db.Date
  gender         Gender
  details        String?   @db.Text
  specialNeeds   Boolean
  roleId         String
  specialization String[]
  guardianId     String?
  
  // Relations
  role          Role     @relation(fields: [roleId], references: [id])
  guardian      User?    @relation("UserGuardian", references: [id])
  dependents    User[]   @relation("UserGuardian")
  taughtClasses Class[]
}
```
- Comprehensive user profile
- Role-based access
- Self-referential guardian relationship
- Specializations as string array
- Links to taught classes (for tutors)

### Role Model
User roles and permissions:
```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?  @db.Text
  permissions Json?
  isActive    Boolean  @default(true)
  
  // Relations
  users       User[]
}
```
- Named roles with descriptions
- JSON-based permissions
- One-to-many relationship with users

## Key Relationships

1. Class Connections:
   - Class → Course (belongs to)
   - Class → Term (scheduled in)
   - Class → Location (held at)
   - Class → User (taught by)
   - Class → Fee (has many)

2. User Relationships:
   - User → Role (has one)
   - User → User (guardian/dependent)
   - User → Class (teaches)

3. Course Organization:
   - Course → CourseCategory (belongs to)
   - Course → Class (has many)

4. Location Usage:
   - Location → Class (hosts many)
   - Location → Event (hosts many)

## Indexed Fields
Important indexes for performance:
- Term: `isActive`, `[startDate, endDate]`
- Location: `isActive`
- CourseCategory: `isActive`
- Class: `courseId`, `termId`, `locationId`, `day`, `startDate`, `endDate`, `status`, `isActive`
- User: `email`, `roleId`, `guardianId`, `isActive`
- Role: `name`, `isActive`
- Event: `locationId`, `canEnroll`, `startDate`, `endDate`, `status`, `isActive`

## Data Types
- IDs: UUID strings
- Dates: `@db.Date` for dates, `@db.Time` for times
- Money: `@db.Decimal(10,2)` for fees (except Event fees which use Float)
- Text: `@db.VarChar(n)` for limited text, `@db.Text` for unlimited
- Arrays: String arrays for rooms, specializations
- JSON: Used for Role permissions

## Deletion Behaviors
- Class → Course: Cascade (delete classes when course is deleted)
- Class → Term: Restrict (prevent term deletion if has classes)
- Class → Location: SetNull (null locationId if location deleted)
- Class → Fee: Cascade (delete fees when class is deleted)
- Event → Location: SetNull (null locationId if location deleted)
- User → Role: Restrict (prevent role deletion if has users)
- User → Guardian: SetNull (null guardianId if guardian deleted)