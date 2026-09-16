# Sơ đồ liên lạc (Communication Diagram)

Giống sequence nhưng nhấn mạnh liên kết đối tượng. Kịch bản: admin nhắc GV chậm kế hoạch.

```mermaid
flowchart LR
  AD((Admin))
  UI[AdminTeachingMonitor]
  API["/api/admin/teaching-progress"]
  TP[teachingPlan.ts]
  DB[(Class + TeachingPlanItem)]
  NT[createNotification]
  GV((Giáo viên))
  BELL[NotificationBell]

  AD --- UI
  UI --- API
  API --- TP
  TP --- DB
  TP --- NT
  NT --- GV
  GV --- BELL

  AD -->|1 click Nhắc GV| UI
  UI -->|2 POST teacherId,classId| API
  API -->|3 remindTeacherAboutPlan| TP
  TP -->|4 summarizePlan overdue| DB
  TP -->|5 type=admin_reminder| NT
  NT -->|6 persist Notification| GV
  GV -->|7 GET /api/notifications| BELL
```

## Thông điệp

| # | Từ | Đến | Nội dung |
|---|----|-----|----------|
| 1 | Admin | UI | Chọn lớp `behind` |
| 2 | UI | API | `{ teacherId, classId }` |
| 3–4 | Server | DB | Tính `overdue` theo ngày VN |
| 5–6 | Server | GV | `href=/teacher/courses/{id}?tab=plan` |
| 7 | GV | Bell | Đọc và đánh dấu đã đọc |
