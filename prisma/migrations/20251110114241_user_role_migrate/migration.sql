/*
  Warnings:

  - The values [Tutor] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `postcode` on table `Location` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('Admin', 'Staff', 'Parent', 'Student');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "postcode" SET NOT NULL;
