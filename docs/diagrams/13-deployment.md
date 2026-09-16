# Sơ đồ triển khai (Deployment Diagram)

```mermaid
flowchart TB
  subgraph DEV["Nút Dev Workstation"]
    BROWSER[Chrome / Safari]
    NODE[Node.js + next dev :3000]
    ENV[.env DATABASE_URL]
  end

  subgraph CLOUD["Nút Neon AWS"]
    POOLER[PgBouncer pooler]
    PG[(PostgreSQL)]
    POOLER --> PG
  end

  subgraph OPTIONAL["Nút họp trực tuyến"]
    JITSI[Jitsi Meet server]
  end

  subgraph PROD["Nút production (mẫu)"]
    HOST[Vercel / VPS Node]
    BUILD[next start]
    HOST --> BUILD
  end

  BROWSER --> NODE
  NODE --> ENV
  NODE -->|TLS 5432 / pooler| POOLER
  BROWSER -->|WebRTC| JITSI
  BROWSER -.->|HTTPS| HOST
  BUILD -->|TLS| POOLER
```

## Artifact

| Artifact | Node |
|----------|------|
| Bundle Next.js (`.next`) | Workstation / Host |
| Prisma Client | cùng process Node |
| `migration.sql` | áp dụng lên Neon lúc `db:migrate:deploy` |
| Cookie JWT | trình duyệt, `HttpOnly` |

Hiện repo seed/dev mặc định trỏ Neon (`ep-*-pooler` us-east-1). Jitsi là dịch vụ ngoài, không lưu media trong Postgres.
