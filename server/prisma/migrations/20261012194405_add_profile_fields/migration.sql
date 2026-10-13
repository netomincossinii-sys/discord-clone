-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activityStartedAt" TIMESTAMP(3),
ADD COLUMN     "activityText" TEXT,
ADD COLUMN     "avatarImage" TEXT,
ADD COLUMN     "bannerColor" TEXT NOT NULL DEFAULT '#f37108',
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "interestTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
