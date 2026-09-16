# Sơ đồ tình huống sử dụng (Use Case Diagram)

```mermaid
flowchart LR
  subgraph Actors
    HS((Học sinh))
    GV((Giáo viên))
    AD((Admin))
  end

  subgraph UC["EduFlow"]
    U1[Đăng ký / đăng nhập]
    U2[Tham gia lớp bằng mã]
    U3[Xem TKB và vào lớp]
    U4[Nộp bài tập]
    U5[Đánh giá buổi học]
    U6[Đánh giá giữa kỳ / cuối kỳ]
    U7[Tạo lớp và kế hoạch]
    U8[Giao bài / chấm bài]
    U9[Điểm danh]
    U10[Mở / kết thúc buổi online]
    U11[Mở cửa sổ đánh giá khoá]
    U12[Duyệt tài khoản]
    U13[Nhắc GV chậm kế hoạch]
    U14[Xem thống kê hoàn thành]
    U15[Chat lớp]
  end

  HS --> U1
  GV --> U1
  AD --> U1
  HS --> U2
  HS --> U3
  HS --> U4
  HS --> U5
  HS --> U6
  HS --> U15
  GV --> U7
  GV --> U8
  GV --> U9
  GV --> U10
  GV --> U11
  GV --> U3
  GV --> U15
  AD --> U12
  AD --> U13
  AD --> U14
  AD --> U7
```

## Include / extend (rút gọn)

- **Nộp bài** include **đăng nhập** và **đã enroll**.
- **Kết thúc buổi online** extend **thông báo đánh giá buổi học**.
- **Nhắc GV** include **so sánh TeachingPlanItem với ngày hiện tại (Asia/Ho_Chi_Minh)**.
- **Mở đánh giá giữa kỳ** extend **gửi notification `course_eval`**.
