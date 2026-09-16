# Sơ đồ khối (FlowChart)

Mô tả luồng chính từ khi người dùng mở EduFlow đến khi hoàn thành một phiên học/giảng.

## 1. Đăng nhập và phân luồng vai trò

```mermaid
flowchart TD
  A[Mở EduFlow] --> B{Đã có phiên JWT?}
  B -->|Có| C[/api/auth/me]
  B -->|Không| D[Trang đăng nhập]
  D --> E{Cách đăng nhập}
  E -->|Email + mật khẩu| F[/api/auth/login]
  E -->|Đăng nhập nhanh| G[/api/auth/quick-login]
  E -->|Đăng ký| H[/api/auth/register]
  H --> I[Chờ admin duyệt]
  F --> J{Vai trò}
  G --> J
  C --> J
  J -->|admin| K[Dashboard quản trị]
  J -->|teacher| L[Dashboard giáo viên]
  J -->|student| M[Dashboard học sinh]
  J -->|pending/suspended| N[Chặn thao tác ghi]
```

## 2. Vòng đời lớp học

```mermaid
flowchart LR
  A[Tạo lớp] --> B[Mã lớp + ClassChat]
  B --> C[Học sinh nhập mã / admin gán roster]
  C --> D[Kế hoạch giảng dạy]
  D --> E[Thời khóa biểu]
  E --> F[Buổi online / điểm danh]
  F --> G[Bài tập + nộp + chấm]
  G --> H[Đánh giá buổi / giữa kỳ / cuối kỳ]
  H --> I{Lớp còn hoạt động?}
  I -->|Có| E
  I -->|Hủy| J[status = cancelled]
```

## 3. Nộp bài học sinh

```mermaid
flowchart TD
  A[HS mở bài tập] --> B{Hạn nộp}
  B -->|Còn hạn| C[status = submitted]
  B -->|Quá hạn| D[status = late]
  C --> E[Thông báo GV]
  D --> E
  E --> F[GV chấm điểm + nhận xét]
  F --> G[Thông báo HS]
```
