-- CreateEnum
CREATE TYPE "Mail_Category" AS ENUM ('SALES', 'PURCHASE', 'COLLABORATION', 'PAYMENT');

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mails" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "mail_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "category" "Mail_Category" NOT NULL,

    CONSTRAINT "Mails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Replies" (
    "id" TEXT NOT NULL,
    "mail_id" TEXT NOT NULL,
    "reply" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "Replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- AddForeignKey
ALTER TABLE "Mails" ADD CONSTRAINT "Mails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replies" ADD CONSTRAINT "Replies_mail_id_fkey" FOREIGN KEY ("mail_id") REFERENCES "Mails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
