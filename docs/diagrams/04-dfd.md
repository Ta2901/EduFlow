# Sơ đồ luồng dữ liệu (DFD)

## DFD mức 0 — ngữ cảnh

```mermaid
flowchart LR
  HS[Học sinh]
  GV[Giáo viên]
  AD[Quản trị viên]
  SYS((EduFlow))
  DB[(PostgreSQL)]
  JT[Jitsi]

  HS -->|đăng nhập, nộp bài, đánh giá, chat| SYS
  GV -->|tạo lớp, giao bài, chấm, mở buổi| SYS
  AD -->|duyệt TK, nhắc GV, thống kê| SYS
  SYS -->|trang + JSON| HS
  SYS -->|trang + JSON| GV
  SYS -->|dashboard| AD
  SYS -->|CRUD| DB
  SYS -->|roomCode| JT
```

## DFD mức 1 — tiến trình

```mermaid
flowchart TB
  subgraph P1["1.0 Xác thực"]
    A1[Đăng ký / đăng nhập / quick-login]
  end
  subgraph P2["2.0 Quản trị tài khoản"]
    A2[Duyệt / hạn chế / import HS]
  end
  subgraph P3["3.0 Lớp và kế hoạch"]
    A3[Lớp, TKB, teaching plan]
  end
  subgraph P4["4.0 Học tập"]
    A4[Bài tập, nộp, chấm, điểm danh]
  end
  subgraph P5["5.0 Online"]
    A5[Session live / chat / ghi hình]
  end
  subgraph P6["6.0 Đánh giá"]
    A6[Session eval + midterm/final]
  end
  subgraph P7["7.0 Thông báo"]
    A7[Notification + ActivityLog]
  end

  D1[(User)]
  D2[(Class / Plan)]
  D3[(Task / Submission)]
  D4[(OnlineSession)]
  D5[(Eval)]
  D6[(Notification)]

  HS((HS)) --> A1
  GV((GV)) --> A1
  AD((Admin)) --> A1
  A1 --> D1
  AD --> A2 --> D1
  GV --> A3 --> D2
  HS --> A3
  GV --> A4
  HS --> A4
  A4 --> D3
  GV --> A5 --> D4
  HS --> A5
  HS --> A6 --> D5
  GV --> A6
  A4 --> A7 --> D6
  A5 --> A7
  A6 --> A7
  AD --> A6
```

## Kho dữ liệu

| Ký hiệu | Bảng chính |
|---------|------------|
| D1 | `User`, `QuickLoginToken`, `PasswordResetToken` |
| D2 | `Class`, `ClassEnrollment`, `ScheduleSlot`, `TeachingPlanItem` |
| D3 | `Task`, `Submission`, `AttendanceRecord` |
| D4 | `OnlineSession`, `SessionMessage`, `ClassChat` |
| D5 | `SessionTeacherEval`, `CourseEvaluation` |
| D6 | `Notification`, `ActivityLog` |
