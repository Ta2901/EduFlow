-- CreateTable
CREATE TABLE IF NOT EXISTS "QuickLoginToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "QuickLoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "QuickLoginToken_tokenHash_key" ON "QuickLoginToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "QuickLoginToken_userId_idx" ON "QuickLoginToken"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "QuickLoginToken" ADD CONSTRAINT "QuickLoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
