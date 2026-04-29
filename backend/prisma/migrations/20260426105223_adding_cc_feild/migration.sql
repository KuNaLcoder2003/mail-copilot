/*
  Warnings:

  - Added the required column `cc` to the `Mails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mails" ADD COLUMN     "cc" TEXT NOT NULL;
