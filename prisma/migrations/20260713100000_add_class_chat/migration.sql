-- CreateTable
CREATE TABLE "ClassChat" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "memberCode" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassChat_classId_key" ON "ClassChat"("classId");

-- AddForeignKey
ALTER TABLE "ClassChat" ADD CONSTRAINT "ClassChat_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassChatMessage" ADD CONSTRAINT "ClassChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "ClassChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassChatMessage" ADD CONSTRAINT "ClassChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: create a chat group for every existing class (name = class title)
INSERT INTO "ClassChat" ("id", "classId", "name", "createdAt")
SELECT
  'classchat_' || c."id",
  c."id",
  c."title",
  CURRENT_TIMESTAMP
FROM "Class" c
WHERE NOT EXISTS (
  SELECT 1 FROM "ClassChat" ch WHERE ch."classId" = c."id"
);
