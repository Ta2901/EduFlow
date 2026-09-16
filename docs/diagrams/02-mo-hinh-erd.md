# Mô hình ERD (The Entity-Relationship Model)

Ánh xạ các model Prisma trong `prisma/schema.prisma`.

## Sơ đồ tổng thể

```mermaid
erDiagram
  User ||--o{ Class : teaches
  User ||--o{ ClassEnrollment : enrolls
  User ||--o{ Submission : writes
  User ||--o{ AttendanceRecord : attends
  User ||--o{ Notification : receives
  User ||--o{ ActivityLog : logs
  User ||--o{ QuickLoginToken : stores
  User ||--o{ PasswordResetToken : resets
  User ||--o{ SessionTeacherEval : rates
  User ||--o{ CourseEvaluationResponse : answers
  User ||--o{ OnlineSession : hosts

  Class ||--o{ ClassEnrollment : has
  Class ||--o{ Task : assigns
  Class ||--o{ ScheduleSlot : timetables
  Class ||--o{ AttendanceRecord : records
  Class ||--o{ OnlineSession : sessions
  Class ||--o| ClassChat : chat
  Class ||--o{ TeachingPlanItem : plans
  Class ||--o{ SessionTeacherEval : sessionEvals
  Class ||--o{ CourseEvaluation : courseEvals

  ClassChat ||--o{ ClassChatMessage : messages
  User ||--o{ ClassChatMessage : sends

  Task ||--o{ TaskAttachment : files
  Task ||--o{ Submission : submissions
  Submission ||--o{ SubmissionFile : files

  ScheduleSlot ||--o{ AttendanceRecord : attendance
  ScheduleSlot ||--o{ OnlineSession : optionalSlot

  OnlineSession ||--o{ SessionMessage : chat
  OnlineSession ||--o{ SessionRecording : recordings
  OnlineSession ||--o{ SessionTeacherEval : evals

  CourseEvaluation ||--o{ CourseEvaluationResponse : responses

  User {
    string id PK
    string email UK
    string memberCode UK
    string role
    string accountStatus
    string password
  }

  Class {
    string id PK
    string classCode UK
    string teacherId FK
    string status
    string termStart
    string termEnd
  }

  Task {
    string id PK
    string classId FK
    string teacherId
    string dueDate
  }

  Submission {
    string id PK
    string taskId FK
    string studentId FK
    string status
    float grade
  }

  OnlineSession {
    string id PK
    string classId FK
    string roomCode UK
    string status
  }

  CourseEvaluation {
    string id PK
    string classId FK
    string kind
    string status
  }
```

## Ràng buộc chính

| Thực thể | Quan hệ | Ghi chú |
|----------|---------|---------|
| `ClassEnrollment` | unique `(classId, studentId)` | Một HS một lần / lớp |
| `Submission` | unique `(taskId, studentId)` | Một bài nộp / HS / task |
| `TeachingPlanItem` | unique `(classId, sessionIndex)` | Thứ tự buổi trong kế hoạch |
| `CourseEvaluation` | unique `(classId, kind)` | `midterm` và `final` |
| `SessionTeacherEval` | unique `(sessionKey, studentId)` | Một đánh giá / buổi / HS |
| `ScheduleSlot` | unique `(classId, dayOfWeek, period)` | TKB tuần |

`StoredFile` độc lập (lưu metadata upload), không khóa ngoại tới `Task`/`Submission`.
