# Sơ đồ lớp (Class Diagram)

Các lớp miền chính tương ứng model Prisma và tầng server (`lib/server/*`).

```mermaid
classDiagram
  class User {
    +String id
    +String email
    +String role
    +String accountStatus
    +String memberCode
  }

  class Class {
    +String id
    +String classCode
    +String teacherId
    +String status
    +String termStart
    +String termEnd
  }

  class ClassEnrollment {
    +String classId
    +String studentId
  }

  class Task {
    +String id
    +String classId
    +String title
    +String dueDate
  }

  class Submission {
    +String id
    +String taskId
    +String studentId
    +String status
    +Float grade
    +String feedback
  }

  class TeachingPlanItem {
    +Int sessionIndex
    +String title
    +String plannedDate
    +String status
  }

  class OnlineSession {
    +String roomCode
    +String status
    +Date startedAt
    +Date endedAt
  }

  class CourseEvaluation {
    +String kind
    +String status
  }

  class SessionTeacherEval {
    +String sessionKey
    +Int rating
  }

  class Notification {
    +String type
    +Boolean read
    +String dedupeKey
  }

  User "1" --> "*" Class : TeacherClasses
  User "1" --> "*" ClassEnrollment
  Class "1" --> "*" ClassEnrollment
  Class "1" --> "*" Task
  Class "1" --> "*" TeachingPlanItem
  Class "1" --> "*" OnlineSession
  Class "1" --> "*" CourseEvaluation
  Task "1" --> "*" Submission
  User "1" --> "*" Submission
  OnlineSession "1" --> "*" SessionTeacherEval
  User "1" --> "*" SessionTeacherEval
  CourseEvaluation "1" --> "*" CourseEvaluationResponse
  User "1" --> "*" Notification
```

## Tầng ứng dụng (không persist)

| Lớp / module | Trách nhiệm |
|--------------|-------------|
| `api` (`lib/api/client.ts`) | HTTP client typed |
| `prisma` proxy | PrismaClient lazy, chống HMR cũ |
| `getSession` | Đọc JWT cookie |
| Zustand stores | `authStore`, `eduStore`, `notificationStore` |
