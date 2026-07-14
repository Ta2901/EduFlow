-- CreateIndex
CREATE INDEX IF NOT EXISTS "Class_teacherId_idx" ON "Class"("teacherId");
CREATE INDEX IF NOT EXISTS "Class_status_idx" ON "Class"("status");
CREATE INDEX IF NOT EXISTS "ClassChatMessage_chatId_createdAt_idx" ON "ClassChatMessage"("chatId", "createdAt");
CREATE INDEX IF NOT EXISTS "OnlineSession_classId_status_idx" ON "OnlineSession"("classId", "status");
CREATE INDEX IF NOT EXISTS "ClassEnrollment_studentId_idx" ON "ClassEnrollment"("studentId");
CREATE INDEX IF NOT EXISTS "Task_classId_idx" ON "Task"("classId");
CREATE INDEX IF NOT EXISTS "Task_teacherId_idx" ON "Task"("teacherId");
CREATE INDEX IF NOT EXISTS "Submission_studentId_idx" ON "Submission"("studentId");
CREATE INDEX IF NOT EXISTS "Submission_taskId_idx" ON "Submission"("taskId");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
