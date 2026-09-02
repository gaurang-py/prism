-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "CreditAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditAdjustment_userId_createdAt_idx" ON "CreditAdjustment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditAdjustment_adminId_createdAt_idx" ON "CreditAdjustment"("adminId", "createdAt");

-- AddForeignKey
ALTER TABLE "CreditAdjustment" ADD CONSTRAINT "CreditAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAdjustment" ADD CONSTRAINT "CreditAdjustment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bootstrap first admin
UPDATE "User" SET "role" = 'admin' WHERE "email" = 'gaurangpatel@tripzygo.in';
