-- AlterTable
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "termStart" TEXT;
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "termEnd" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "TeachingPlanItem" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "plannedDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SessionTeacherEval" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "onlineSessionId" TEXT,
    "studentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionTeacherEval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CourseEvaluation" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CourseEvaluationResponse" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teachingQuality" INTEGER NOT NULL,
    "contentClarity" INTEGER NOT NULL,
    "pacing" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseEvaluationResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TeachingPlanItem_classId_sessionIndex_key" ON "TeachingPlanItem"("classId", "sessionIndex");
CREATE INDEX IF NOT EXISTS "TeachingPlanItem_classId_idx" ON "TeachingPlanItem"("classId");
CREATE INDEX IF NOT EXISTS "TeachingPlanItem_plannedDate_status_idx" ON "TeachingPlanItem"("plannedDate", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "SessionTeacherEval_sessionKey_studentId_key" ON "SessionTeacherEval"("sessionKey", "studentId");
CREATE INDEX IF NOT EXISTS "SessionTeacherEval_classId_createdAt_idx" ON "SessionTeacherEval"("classId", "createdAt");
CREATE INDEX IF NOT EXISTS "SessionTeacherEval_onlineSessionId_idx" ON "SessionTeacherEval"("onlineSessionId");

CREATE UNIQUE INDEX IF NOT EXISTS "CourseEvaluation_classId_kind_key" ON "CourseEvaluation"("classId", "kind");
CREATE INDEX IF NOT EXISTS "CourseEvaluation_status_idx" ON "CourseEvaluation"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "CourseEvaluationResponse_evaluationId_studentId_key" ON "CourseEvaluationResponse"("evaluationId", "studentId");
CREATE INDEX IF NOT EXISTS "CourseEvaluationResponse_studentId_idx" ON "CourseEvaluationResponse"("studentId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "TeachingPlanItem" ADD CONSTRAINT "TeachingPlanItem_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SessionTeacherEval" ADD CONSTRAINT "SessionTeacherEval_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SessionTeacherEval" ADD CONSTRAINT "SessionTeacherEval_onlineSessionId_fkey"
    FOREIGN KEY ("onlineSessionId") REFERENCES "OnlineSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SessionTeacherEval" ADD CONSTRAINT "SessionTeacherEval_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseEvaluation" ADD CONSTRAINT "CourseEvaluation_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseEvaluationResponse" ADD CONSTRAINT "CourseEvaluationResponse_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES "CourseEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseEvaluationResponse" ADD CONSTRAINT "CourseEvaluationResponse_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
