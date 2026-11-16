# Architecture Overview

Vision is a privacy-focused analytics platform. It is built as a full-stack web application using modern JavaScript ecosystem tools, and it is capable of scaling its data storage tier using ClickHouse.

## Core Technologies
- **Framework**: Next.js (App Router) using Turbopack. It acts as both the frontend UI and the backend API.
- **Database (Relational)**: PostgreSQL. Managed via **Prisma** ORM. Used for managing users, projects, teams, and core configurations. By default, it also stores analytics events.
- **Database (Analytics - Optional)**: ClickHouse. For high-scale deployments, Umami can route massive streams of analytics data (events, pageviews) directly to ClickHouse, keeping PostgreSQL strictly for relational app data.
- **Tracker**: A lightweight, dependency-free JavaScript file (`src/tracker/index.js`) that is deployed to client projects.
- **Caching & Queuing**: Redis and Kafka (optional, supported via `src/lib/redis.ts` and `src/lib/kafka.ts` for massive scaling).

## System Components

1. **Dashboard (Frontend)**
   A React-based interface for users to view analytics, manage projects, and configure teams. Served via Next.js (`src/app/(main)`).

2. **Collection API**
   The highly optimized API endpoint (`/api/send`) that receives telemetry from the tracker script. It handles bot detection, caching, session creation, and data persistence.

3. **Storage Layer**
   Abstracted query logic (located in `src/queries`) that writes either to PostgreSQL (via Prisma) or ClickHouse depending on the environment configuration (`clickhouse.enabled`).

4. **Data Synchronization**
   The platform uses Prisma schema migrations to maintain database integrity (`prisma/schema.prisma`) and handles updates deterministically.
