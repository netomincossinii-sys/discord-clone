-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;

-- CreateIndex
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_googleId_key') THEN
    CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
  END IF;
END $$;
