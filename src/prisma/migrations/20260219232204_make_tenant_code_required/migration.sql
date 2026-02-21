/*
  Warnings:

  - Made the column `code` on table `Tenant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "code" SET NOT NULL;
