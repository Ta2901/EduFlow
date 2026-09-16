# Sơ đồ phối hợp thời gian (Timing Diagram — UML 2.0)

Trạng thái theo thời gian của một buổi học online và bài tập liên quan.

## Timeline buổi học + đánh giá

```mermaid
gantt
  title Một buổi Toán 10A1 (múi giờ Asia/Ho_Chi_Minh)
  dateFormat  YYYY-MM-DD HH:mm
  axisFormat  %H:%M

  section OnlineSession
  scheduled           :s1, 2026-07-14 07:00, 30m
  live                :s2, after s1, 45m
  ended               :s3, after s2, 20m

  section Học sinh A
  trong lớp           :a1, 2026-07-14 07:30, 45m
  điền session eval   :a2, after a1, 15m

  section Giáo viên
  host live           :g1, 2026-07-14 07:30, 45m
  xem điểm eval       :g2, 2026-07-14 08:30, 15m
```

## Lifeline trạng thái (rút gọn UML Timing)

```
Đối tượng        07:00      07:30       08:15      08:30
OnlineSession    scheduled──live────────ended────────────────
HS.attendance    ──────────present───────────────────────────
SessionEval      ────────────────────────pending──submitted──
Notification     ────────────────────────unread───read───────
```

## Ràng buộc thời gian trong code

| Điều kiện | Thời điểm |
|-----------|-----------|
| Nộp đúng hạn | `submittedAt` ≤ `Task.dueDate` → `submitted` |
| Nộp muộn | sau `dueDate` → `late` |
| Plan overdue | `plannedDate < today` (VN) và `status=planned` |
| Session eval | chỉ khi `OnlineSession.status = ended` |
| Course eval | chỉ khi `CourseEvaluation.status = open` |
| Quick-login | `expiresAt`; revoke khi đổi mật khẩu |
