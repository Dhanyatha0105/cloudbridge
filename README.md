# CloudBridge — Sustainable Hybrid-Cloud Modernisation Platform

A production-grade platform that migrates legacy on-premises enterprise workloads to a sustainable hybrid-cloud architecture. Built around real operational concerns: phased low-risk migration, IoT-driven carbon tracking, SAP BTP/CPI integration, and Zero Trust security — all managed from a single ReactJS/Redux dashboard.

## What it does

**The problem:** Large enterprises running on ageing on-premises infrastructure face three interlinked challenges — high energy cost and carbon footprint, tightly coupled legacy applications that resist migration, and fragmented tooling (ERP, ITSM, identity) with no unified control plane.

**The solution:** CloudBridge provides a phased migration engine with real rollback support, a live carbon dashboard fed by IoT sensors, SAP CPI integration flows with XSLT/Groovy transformations, and a hybrid control plane built on Azure Arc that treats on-premises and cloud nodes identically.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│             Azure Arc Control Plane                       │
│      Azure Stack HCI (on-prem) ↔ AKS (West Europe)      │
└────────────┬─────────────────────────┬────────────────────┘
             │                         │
    ┌────────▼──────────┐   ┌──────────▼──────────┐
    │  ReactJS / Redux  │   │  Node.js API Gateway │
    │  SPA Dashboard    │   │  Zero Trust · JWT    │
    └────────┬──────────┘   └──────────┬───────────┘
             │                         │
    ┌────────▼──────────┐   ┌──────────▼──────────┐
    │  SAP BTP / CPI    │   │  IoT Carbon Service  │
    │  XSLT · Groovy    │   │  InfluxDB · WS feed  │
    └───────────────────┘   └─────────────────────┘
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Redux Toolkit, TailwindCSS, Recharts |
| Backend | Node.js, Express, file-based persistence (swap to PostgreSQL) |
| Integration | SAP BTP/CPI, Groovy scripts, XSLT, ODATA, ServiceNow webhook |
| Infrastructure | Azure Arc, Azure Stack HCI, Kubernetes manifests |
| Security | Zero Trust, JWT/OAuth 2.0, PGP payload encryption (RSA-OAEP + AES-256-GCM) |
| Sustainability | IoT sensor ingestion, modelled CO₂ from workload inventory, Net Zero trajectory |
| Monitoring | Prometheus, Grafana, structured Winston logs |

## Modules

| Module | What it does |
|---|---|
| Migration Engine | 3-phase orchestrator — start, poll progress, rollback with workload state written to disk |
| Carbon Tracker | IoT ingest endpoint + workload-modelled fallback; 24h history; Net Zero milestones |
| SAP Integration | OAuth 2.0 token cache, iFlow definitions, XSLT/Groovy transform tester, ServiceNow HMAC webhook |
| Infrastructure | Azure Arc cluster/node registry; seeded from startup, queryable by type/status |
| Security | Zero Trust middleware, bcrypt auth, PGP hybrid encryption utility, RBAC on every route |

## Running locally

```bash
# Install all dependencies
npm run install:all

# Copy and fill in env (SAP/Azure/ServiceNow creds are optional — system runs disconnected without them)
cp backend/.env.example backend/.env

# Start everything
npm run dev
# Frontend → http://localhost:3000
# API      → http://localhost:4000
# IoT      → http://localhost:5000
```

**Default credentials** (set via `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars, or change after first run):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cloudbridge.internal` | `ChangeMe@Prod1!` |
| Engineer | `engineer@cloudbridge.internal` | `ChangeMe@Eng1!` |

## Connecting external services

The system runs fully without any external connections — SAP BTP, ServiceNow, and Azure credentials are optional. When set, it connects live; when absent, it logs a warning and operates on local state.

| Service | Env vars needed |
|---|---|
| SAP BTP / CPI | `SAP_BTP_HOST`, `SAP_CLIENT_ID`, `SAP_CLIENT_SECRET`, `SAP_TOKEN_URL`, `SAP_CPI_HOST` |
| ServiceNow | `SERVICENOW_HOST`, `SNOW_WEBHOOK_SECRET` |
| Azure | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_SUBSCRIPTION_ID` |

## Production deployment

Kubernetes manifests are in `infrastructure/azure-arc/arc-deployment.yaml` — deployable to any Arc-managed cluster (on-premises AKS or AKS). Prometheus scrape config and a Docker Compose stack for local infra are in `infrastructure/monitoring/`.
