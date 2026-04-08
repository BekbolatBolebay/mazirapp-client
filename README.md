# Mazir App - Deployment & Infrastructure Overview

This repository contains the containerized setup for the **Mazir App** (Client & Admin) and its self-hosted **Supabase** infrastructure.

## 🏗 Architecture Overview
The system is orchestrated using **Docker Compose** and consists of three main layers:

1.  **Application Layer**:
    *   **Client App** (`food-app-build`): Next.js project in standalone mode.
    *   **Admin Panel** (`admin`): Next.js project in standalone mode.
2.  **Data & Backend Layer (Supabase)**:
    *   **PostgreSQL**: High-performance database optimized for 32GB RAM.
    *   **Auth (GoTrue)**: User authentication and management.
    *   **PostgREST**: Instant RESTful API for the database.
    *   **Kong**: API Gateway and routing.
    *   **Storage API**: Local filesystem-based storage for media.
3.  **Ingress Layer**:
    *   **Nginx Proxy Manager (NPM)**: Handles SSL (Let's Encrypt), domain routing, and the reverse proxy.

## 📁 Repository Structure
```text
.
├── admin/               # Admin Next.js project
├── food-app-build/      # Client Next.js project
├── supabase/            # Infrastructure configs
│   ├── postgresql.conf  # Memory-optimized DB settings
│   └── kong.yml         # API Gateway routes
├── Dockerfile.next      # Multi-staged standalone Dockerfile
├── docker-compose.yml   # Main orchestration file
└── .env.example         # Environment template
```

## 🚀 Deployment Guide

### 1. Requirements
*   **OS**: Ubuntu 22.04 LTS or similar.
*   **Hardware**: Minimum 32GB RAM recommended (Optimized for high-load Postgres).
*   **Disk**: Mounted at `/mnt/data/` for persistence.

### 2. Preparation
1.  Copy `.env.example` to `.env`.
2.  Update `POSTGRES_PASSWORD`, `JWT_SECRET`, and domain URLs in `.env`.
3.  Ensure your DNS records point `mazirapp.kz`, `admin.mazirapp.kz`, and `api.mazirapp.kz` to the server IP.

### 3. Execution
```bash
# Build and launch the entire stack
docker-compose up -d --build
```

## ⚙️ Resource Management
The PostgreSQL instance is configured with:
*   **RAM Limit**: 32GB
*   **Shared Buffers**: 8GB
*   **Persistence**: Mapped to `/mnt/data/supabase/db`.

## 🔒 Security
*   All internal services (DB, Auth, etc.) are isolated within a private Docker network.
*   Only **Nginx Proxy Manager** (Ports 80, 81, 443) is exposed to the public internet.

---
*For technical support, refer to the [Migration Guide](file:///home/bekbolat/Жүктемелер/Mazir App/food-app-build/brain/667c6eb0-3b7f-49c6-80f8-c84a3b52399c/migration_guide.md).*
