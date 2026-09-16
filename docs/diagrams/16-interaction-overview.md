# Sơ đồ tương tác tổng quan (Interaction Overview — UML 2.0)

Kết hợp activity + sequence: khung điều khiển chứa các tương tác con.

```mermaid
flowchart TD
  start([Bắt đầu khoá]) --> create[Tạo lớp + chat]
  create --> plan[Interaction: lập TeachingPlan]
  plan --> openEval{Tới giữa kỳ?}
  openEval -->|Chưa| week[Interaction: tuần học]
  week --> online[Interaction: buổi online]
  online --> hw[Interaction: giao / nộp / chấm]
  hw --> check{Kế hoạch đúng hạn?}
  check -->|Chậm| remind[Interaction: admin nhắc]
  remind --> week
  check -->|Đúng| openEval
  openEval -->|Có| mid[Interaction: mở + nộp midterm]
  mid --> more{Còn buổi?}
  more -->|Có| week
  more -->|Hết| fin[Interaction: mở + nộp final]
  fin --> end([Kết thúc khoá])
```

## Các interaction được tham chiếu

| Khung | Chi tiết (xem Sequence) |
|-------|-------------------------|
| Lập kế hoạch | `PUT /teaching-plan` |
| Buổi online | start → Jitsi → end → session-eval |
| Giao/nộp/chấm | task → submit → grade |
| Admin nhắc | `POST /api/admin/teaching-progress` |
| Midterm / final | `setCourseEvalStatus` + `submitCourseEval` |
