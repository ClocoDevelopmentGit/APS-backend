/*
  Warnings:

  - You are about to drop the column `ageRange` on the `CourseCategory` table. All the data in the column will be lost.
  - Added the required column `mediaType` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaUrl` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "ageRange" VARCHAR(50),
ADD COLUMN     "mediaType" TEXT NOT NULL,
ADD COLUMN     "mediaUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CourseCategory" DROP COLUMN "ageRange";
