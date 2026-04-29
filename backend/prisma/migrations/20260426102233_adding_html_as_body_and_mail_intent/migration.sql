/*
  Warnings:

  - Added the required column `html` to the `Mails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intent` to the `Mails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mails" ADD COLUMN     "html" TEXT NOT NULL,
ADD COLUMN     "intent" TEXT NOT NULL;
