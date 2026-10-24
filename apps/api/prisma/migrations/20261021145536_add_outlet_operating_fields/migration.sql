/*
  Warnings:

  - Added the required column `tableNumberLimit` to the `Outlet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "address" TEXT,
ADD COLUMN     "closeTime" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openTime" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tableNumberLimit" INTEGER NOT NULL,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta';
