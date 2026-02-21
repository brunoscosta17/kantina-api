/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Tenant_name_key";

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");
