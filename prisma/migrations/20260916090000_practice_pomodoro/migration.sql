CREATE TABLE IF NOT EXISTS "PracticeSet" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "pomodoroMinutes" INTEGER NOT NULL DEFAULT 25,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PracticeQuestion" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PracticeOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PracticeOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "optionOrder" TEXT NOT NULL DEFAULT '{}',
    "score" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "pomodoroMinutes" INTEGER NOT NULL DEFAULT 25,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PracticeAttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PracticeAttemptAnswer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PracticeSet_classId_idx" ON "PracticeSet"("classId");
CREATE INDEX IF NOT EXISTS "PracticeSet_teacherId_idx" ON "PracticeSet"("teacherId");
CREATE INDEX IF NOT EXISTS "PracticeQuestion_setId_idx" ON "PracticeQuestion"("setId");
CREATE INDEX IF NOT EXISTS "PracticeOption_questionId_idx" ON "PracticeOption"("questionId");
CREATE INDEX IF NOT EXISTS "PracticeAttempt_setId_studentId_startedAt_idx" ON "PracticeAttempt"("setId", "studentId", "startedAt");
CREATE INDEX IF NOT EXISTS "PracticeAttempt_studentId_startedAt_idx" ON "PracticeAttempt"("studentId", "startedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PracticeAttemptAnswer_attemptId_questionId_key" ON "PracticeAttemptAnswer"("attemptId", "questionId");
CREATE INDEX IF NOT EXISTS "PracticeAttemptAnswer_questionId_idx" ON "PracticeAttemptAnswer"("questionId");

DO $$ BEGIN
  ALTER TABLE "PracticeSet" ADD CONSTRAINT "PracticeSet_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeSet" ADD CONSTRAINT "PracticeSet_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_setId_fkey"
    FOREIGN KEY ("setId") REFERENCES "PracticeSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeOption" ADD CONSTRAINT "PracticeOption_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_setId_fkey"
    FOREIGN KEY ("setId") REFERENCES "PracticeSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeAttemptAnswer" ADD CONSTRAINT "PracticeAttemptAnswer_attemptId_fkey"
    FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeAttemptAnswer" ADD CONSTRAINT "PracticeAttemptAnswer_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PracticeAttemptAnswer" ADD CONSTRAINT "PracticeAttemptAnswer_optionId_fkey"
    FOREIGN KEY ("optionId") REFERENCES "PracticeOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
