-- CreateTable
CREATE TABLE "ThreadContext" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "context" TEXT NOT NULL,

    CONSTRAINT "ThreadContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThreadContext_thread_id_key" ON "ThreadContext"("thread_id");

-- AddForeignKey
ALTER TABLE "ThreadContext" ADD CONSTRAINT "ThreadContext_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
