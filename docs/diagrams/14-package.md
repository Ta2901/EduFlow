# Sơ đồ gói (Package Diagram)

```mermaid
flowchart TB
  subgraph app["app"]
    pages["pages (role dashboards)"]
    api["api route handlers"]
  end

  subgraph components["components"]
    dash["dashboard"]
    klass["class / eval"]
    online["online"]
    admin["admin"]
    settings["settings / theme"]
  end

  subgraph lib["lib"]
    client["api/client"]
    stores["stores"]
    server["server/*"]
    prisma["prisma"]
  end

  subgraph prismaPkg["prisma"]
    schema["schema.prisma"]
    mig["migrations"]
  end

  pages --> components
  pages --> stores
  components --> client
  api --> server
  client --> api
  server --> prisma
  prisma --> schema
```

## Phụ thuộc chiều

- `app` dùng `components` và `lib`, không ngược lại.
- `lib/server` không import React.
- `components` chỉ gọi `lib/api/client`, không gọi Prisma trực tiếp.

## Gói server chi tiết

```
lib/server
  account.ts        session.ts
  edu.ts            admin.ts
  schedule.ts       online.ts
  teachingPlan.ts   evaluations.ts
  notifications.ts  activityLog.ts
  classChat.ts      studentProgress.ts
  quickLogin.ts     passwordReset.ts
```
