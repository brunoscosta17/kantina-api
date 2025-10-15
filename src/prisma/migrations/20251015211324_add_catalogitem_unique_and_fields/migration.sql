/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,categoryId,name]` on the table `CatalogItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name,classroom]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."CatalogItem_tenantId_categoryId_idx";

-- DropIndex
DROP INDEX "public"."Student_tenantId_idx";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "sortOrder" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
ALTER COLUMN "role" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "balanceCents" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_tenantId_categoryId_name_key" ON "CatalogItem"("tenantId", "categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_tenantId_name_classroom_key" ON "Student"("tenantId", "name", "classroom");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "Tenant"("name");
