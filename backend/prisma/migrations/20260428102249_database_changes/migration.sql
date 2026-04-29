/*
  Warnings:

  - A unique constraint covering the columns `[mail_id]` on the table `Mails` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Missed_Mail_Status" AS ENUM ('COMPLETED', 'PENDING');

-- CreateTable
CREATE TABLE "Missed" (
    "mail_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "status" "Missed_Mail_Status" NOT NULL,
    "user_id" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Missed_mail_id_key" ON "Missed"("mail_id");

-- CreateIndex
CREATE UNIQUE INDEX "Mails_mail_id_key" ON "Mails"("mail_id");

-- AddForeignKey
ALTER TABLE "Missed" ADD CONSTRAINT "Missed_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
