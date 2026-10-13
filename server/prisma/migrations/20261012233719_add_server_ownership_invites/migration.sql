-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "inviteCodeCreatedAt" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Server_inviteCode_key" ON "Server"("inviteCode");

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

