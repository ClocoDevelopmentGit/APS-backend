-- CreateTable
CREATE TABLE "GoogleReview" (
    "id" TEXT NOT NULL,
    "reviewerName" VARCHAR(255) NOT NULL,
    "reviewText" TEXT,
    "reviewDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" VARCHAR(255),
    "updatedBy" VARCHAR(255),

    CONSTRAINT "GoogleReview_pkey" PRIMARY KEY ("id")
);
