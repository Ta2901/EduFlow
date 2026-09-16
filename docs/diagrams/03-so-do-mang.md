# Sơ đồ mạng máy tính

Mô tả kết nối logic khi chạy EduFlow (dev local hoặc triển khai).

## Môi trường phát triển / triển khai điển hình

```mermaid
flowchart TB
  subgraph LAN["Mạng người dùng"]
    HS[Trình duyệt học sinh]
    GV[Trình duyệt giáo viên]
    AD[Trình duyệt admin]
  end

  subgraph EDGE["HTTPS"]
    DNS[DNS / CDN tuỳ chọn]
  end

  subgraph APP["Máy chủ ứng dụng"]
    NEXT[Next.js 14<br/>port 3000]
    API["Route Handlers /api/*"]
    JWT[Cookie JWT HttpOnly]
    NEXT --- API
    API --- JWT
  end

  subgraph DATA["Lớp dữ liệu"]
    POOL[pg Pool]
    NEON[(PostgreSQL Neon<br/>pooled + SSL)]
    POOL --- NEON
  end

  subgraph MEDIA["Dịch vụ bên ngoài"]
    JITSI[Jitsi Meet<br/>phòng học online]
    FS[Lưu tệp / URL tĩnh]
  end

  HS --> DNS
  GV --> DNS
  AD --> DNS
  DNS --> NEXT
  API --> POOL
  HS -.->|WebRTC / iframe| JITSI
  GV -.->|WebRTC / iframe| JITSI
  API --> FS
```

## Luồng gói tin chính

1. Trình duyệt gửi cookie phiên tới `localhost:3000` (dev) hoặc origin HTTPS.
2. Next.js xử lý SSR/CSR; API đọc session, gọi Prisma qua `pg` adapter.
3. Neon yêu cầu TLS (`sslmode`); pool tối đa 10 kết nối trong `lib/prisma.ts`.
4. Buổi học online: EduFlow tạo `OnlineSession.roomCode`, client nối Jitsi — media không đi qua PostgreSQL.

## Phân đoạn bảo mật

| Vùng | Nội dung |
|------|----------|
| Client | UI React, không giữ mật khẩu sau login |
| App | JWT cookie, `requireAdmin` / kiểm tra enrollment |
| Data | Neon isolated; `.env` không commit |
| Media | Jitsi tách kênh audio/video |
