# Sơ đồ đối tượng (Object Diagram)

Ảnh chụp instance tại một thời điểm — ví dụ seed demo Toán 10A1.

```mermaid
classDiagram
  class lan {
    id = cmrbgw4ci...
    email = teacher@eduflow.com
    role = teacher
    memberCode = 100001
  }
  class minh {
    id = student-demo
    email = student@eduflow.com
    role = student
    memberCode = 100002
  }
  class admin1 {
    email = eduflow.admin
    role = admin
    accountStatus = active
  }
  class toan10A1 {
    title = Toán học lớp 10A1
    classCode = MATH10A
    status = active
  }
  class enroll1 {
    joinedAt = now
  }
  class task1 {
    title = Bài tập chương 1
    dueDate = 2026-07-20
  }
  class sub1 {
    status = submitted
    grade = null
  }
  class plan1 {
    sessionIndex = 1
    status = planned
    plannedDate = 2026-07-01
  }
  class evalMid {
    kind = midterm
    status = draft
  }

  lan --> toan10A1 : teacherId
  toan10A1 --> enroll1
  minh --> enroll1
  toan10A1 --> task1
  task1 --> sub1
  minh --> sub1
  toan10A1 --> plan1
  toan10A1 --> evalMid
  admin1 ..> lan : nhắc tiến độ
```

## Ý nghĩa

Object diagram không thay ERD: nó cho thấy **một cấu hình cụ thể** (GV Lan, HS, lớp MATH10A, bài chưa chấm, kế hoạch buổi 1, đánh giá giữa kỳ còn `draft`).
