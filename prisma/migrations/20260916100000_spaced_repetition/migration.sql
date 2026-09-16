CREATE TABLE IF NOT EXISTS "PracticeCardState" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "box" INTEGER NOT NULL DEFAULT 1,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRating" TEXT,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeCardState_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PracticeAttemptAnswer" ADD COLUMN IF NOT EXISTS "rating" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "PracticeCardState_studentId_questionId_key" ON "PracticeCardState"("studentId", "questionId");
CREATE INDEX IF NOT EXISTS "PracticeCardState_setId_studentId_nextReviewAt_idx" ON "PracticeCardState"("setId", "studentId", "nextReviewAt");
CREATE INDEX IF NOT EXISTS "PracticeCardState_nextReviewAt_idx" ON "PracticeCardState"("nextReviewAt");

DO $$ BEGIN
  ALTER TABLE "PracticeCardState" ADD CONSTRAINT "PracticeCardState_setId_fkey"
    FOREIGN KEY ("setId") REFERENCES "PracticeSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeCardState" ADD CONSTRAINT "PracticeCardState_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeCardState" ADD CONSTRAINT "PracticeCardState_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
