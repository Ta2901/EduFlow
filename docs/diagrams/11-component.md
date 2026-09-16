# Sơ đồ thành phần (Component Diagram)

```mermaid
flowchart TB
  subgraph CLIENT["Client"]
    PAGES[app/*/page.tsx]
    COMP[components/*]
    STORE[Zustand stores]
    APIC[lib/api/client.ts]
    PAGES --> COMP
    COMP --> STORE
    COMP --> APIC
  end

  subgraph NEXT["Next.js"]
    RH[Route Handlers app/api]
    AUTH[lib/server/session + account]
    EDU[lib/server/edu]
    ADM[lib/server/admin]
    PLAN[lib/server/teachingPlan]
    EVAL[lib/server/evaluations]
    ONL[lib/server/online]
    NTF[lib/server/notifications]
  end

  subgraph INFRA["Infrastructure"]
    PRISMA[lib/prisma.ts]
    PG[(Neon PostgreSQL)]
    JITSI[Jitsi]
  end

  APIC --> RH
  RH --> AUTH
  RH --> EDU
  RH --> ADM
  RH --> PLAN
  RH --> EVAL
  RH --> ONL
  EDU --> NTF
  ONL --> NTF
  EVAL --> NTF
  EDU --> PRISMA
  ADM --> PRISMA
  PLAN --> PRISMA
  EVAL --> PRISMA
  ONL --> PRISMA
  PRISMA --> PG
  COMP -.-> JITSI
```

## Thành phần giao diện nổi bật

| Component | Vai trò |
|-----------|---------|
| `DashboardShell` | Khung GV/HS |
| `AdminWorkCharts` | Thống kê hoàn thành, click → danh sách |
| `AdminTeachingMonitor` | Tiến độ kế hoạch + nhắc GV |
| `TeachingPlanPanel` | CRUD kế hoạch |
| `StudentEvalPanel` | Đánh giá buổi và khoá |
| `OnlineSessionPanel` | Tạo/start/end phòng |
| `NotificationBell` | Đọc thông báo |
