# WBF Organisation Platform

A collaboration platform for Western Balkans organisations covering onboarding, partner discovery, messaging, social updates, and dual-level administration. This README is the canonical project documentation—share it with clients, new engineers, or operations teams to explain how the system works end-to-end.

---

## Contents

1. [Overview](#overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Repository Structure](#repository-structure)
4. [Build Journey](#build-journey)
5. [Local Setup](#local-setup)
6. [Environment Configuration](#environment-configuration)
7. [Backend Architecture](#backend-architecture)
8. [Frontend Architecture](#frontend-architecture)
9. [Shared Package](#shared-package)
10. [Data Model & Storage Strategy](#data-model--storage-strategy)
11. [Quality & Tooling](#quality--tooling)
12. [Deployment Strategy](#deployment-strategy)
13. [Updates & Maintenance](#updates--maintenance)
14. [Key Commands & Scripts](#key-commands--scripts)
15. [Core API Endpoints](#core-api-endpoints)
16. [Known Gaps & Next Steps](#known-gaps--next-steps)
17. [Launch & Handover Checklist](#launch--handover-checklist)
18. [License](#license)

---

## Overview

The WBF Organisation Platform enables multi-step registration, profile management, messaging, opportunity discovery, and administration for NGOs across the region. It is built as a TypeScript monorepo with a React admin panel, Express API, MongoDB persistence, and a messaging subsystem modeled after Firestore collections for scalability.

Key capabilities:
- Two-step organisation onboarding with email/phone verification and admin review.
- Embedded data strategy: calls, projects, wall posts, and messaging metadata live inside organisation documents to keep related data together.
- Dual user roles (organisation + super admin) with separate login flows, dashboards, and permissions.
- Conversation system for direct, application, and notification messages with unread counters.
- Social wall for organisation announcements, reactions, and comments.

---

## Architecture & Tech Stack

- **Monorepo**: TurboRepo orchestrates builds, dev servers, linting, and type checks.
- **Frontend**: React 18, Vite, TypeScript, Mantine UI, Redux Toolkit (state + API calls), React Router, Axios.
- **Backend**: Express 4, TypeScript, MongoDB (via a Firestore-like wrapper), JWT auth, Joi validation, Nodemailer, Helmet, CORS, rate limiting.
- **Database**: MongoDB collections (`organisations`, `admin_users`, `super_admin_users`, `email_verifications`, `conversations`, `organisationConversations`).
- **Storage**: AWS S3 for all media uploads (logos, covers, wall posts, super-admin assets) handled server-side via signed SDK calls.
- **Messaging & Social**: Custom conversation hierarchy plus organisation-embedded wall posts; aligned with requirement to store project/call data inside organisation records.
- **Shared Utilities**: `packages/shared` holds reusable types and helpers across apps.

---

## Repository Structure

```
39:47:README.md
wbf-platform/
├── apps/
│   ├── admin-panel/        # Frontend React application
│   └── backend/            # Backend Express API
├── packages/
│   └── shared/             # Shared types and utilities
├── package.json            # TurboRepo root configuration
└── turbo.json              # Build pipeline configuration
```

---

## Build Journey

1. **Monorepo foundation** with TurboRepo for consistent tooling and caching.
2. **Shared types package** extracted to prevent contract drift.
3. **Backend API** created with Express, Firestore-like Mongo wrapper, modular routes, and JWT auth.
4. **Frontend admin panel** scaffolded via Vite + Mantine; Redux slices centralise API calls per project preference.
5. **Dual user system** and scripts for super admin provisioning.
6. **Messaging + wall features** layered on top, honoring “single organisation collection” data policy.
7. **Operational tooling** (CSV imports, super admin scripts, Nodemailer notifications) added for deployment-readiness.

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 10
- MongoDB instance (local or Atlas)
- SMTP credentials for transactional emails

### Steps
```bash
git clone <repository-url>
cd wbf-platform
npm install
```

Run all apps: `npm run dev`  
Run individually:
```bash
npm run dev --workspace=apps/backend
npm run dev --workspace=apps/admin-panel
```

Build for production:
```bash
npm run build               # all apps
npm run start --workspace=apps/backend
npm run preview --workspace=apps/admin-panel
```

---

## Environment Configuration

### Backend (`apps/backend/.env`)
```
# JWT Configuration
JWT_SECRET=your_jwt_secret_here_make_it_long_and_secure

# SMTP Configuration
SMTP_HOST=mail.cpanel1.gohost.mk
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password
SMTP_SECURE=false

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=wbf-platform

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# AWS S3
AWS_REGION=eu-north-1
AWS_S3_BUCKET=partnership-project-mainstorage
# Optional custom domain (CloudFront, etc.)
# AWS_S3_PUBLIC_URL=https://partnership-project-mainstorage.s3.eu-north-1.amazonaws.com
# Credentials must be supplied via environment variables or your secret manager
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

### Frontend (`apps/admin-panel/.env`)

Create the file and set:
```
VITE_API_BASE_URL=http://localhost:3101/api
```

All Redux slices and services rely on this single variable, keeping API usage centralised.

---

## Backend Architecture

### Server & Middleware
```
21:108:apps/backend/src/index.ts
const app = express();
...
app.use(helmet());
app.use(rateLimit({ ... }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
...
app.use("/api/auth", authRoutes);
app.use("/api/organisation", organisationRoutes);
...
```
- Reverse-proxy aware for secure cookies.
- Rate limiting, Helmet, and strict CORS allow-list + Vercel preview support.
- `/health` endpoint for liveness checks.

### Authentication & Registration
```
93:905:apps/backend/src/routes/auth.ts
- Email + phone verification via Mongo + in-memory storage.
- `POST /auth/register/simple` → draft organisation + hashed password + JWT.
- `POST /auth/register/step-2` → completes profile, status `pending`.
- `POST /auth/admin/login` → super admin JWT with login tracking.
- `GET /auth/me` → returns org or admin payload based on role.
```

### Organisation Management
```
1:367:apps/backend/src/routes/organisation.ts
- Firestore-style collection wrapper on MongoDB.
- `groupOrganisationData` normalises responses.
- Advanced `/organisation/browse` filters for sector, staff size, thematic areas.
- Logo, cover, project, and success-story uploads stream through the backend into AWS S3 to keep credentials server-side.
```

### Admin & Super Admin
```
10:253:apps/backend/src/routes/admin.ts
20:333:apps/backend/src/routes/super-admin.ts
- Admins review pending orgs, send approval/decline emails, view stats.
- Super admins list/search all orgs, suspend/unsuspend, manage admin users, view dashboard metrics.
- Login tracking stored on each organisation.
```

### Messaging Subsystem
```
1:605:apps/backend/src/routes/messaging.ts
5:99:apps/backend/MESSAGING_STRUCTURE.md
- Conversations stored in Mongo collections that mimic Firestore (conversations + messages subcollection).
- Per-organisation indices (`organisationConversations`) maintain unread counts and categories (inbox, applications, notifications, etc.).
- Email notifications triggered for direct + application messages.
```

### Wall & Social Feed
```
1:398:apps/backend/src/routes/wall.ts
- Wall posts embedded inside each organisation document.
- API exposes pagination, posting, reactions, and comments.
- Wall post images are uploaded to AWS S3 through the backend before being referenced in organisation documents.
```

### Utility Scripts & Imports
```
1:50:apps/backend/scripts/create-super-admin.ts
- `npm run create:super-admin` seeds a privileged account (change password immediately).
```

```
1:47:apps/backend/imports/README.md
- CSV + image import guidance for seeding organisations.
```

---

## Frontend Architecture

- Vite entry mounts Mantine providers and React Router pages under `src/pages`.
- Redux store (`src/store/index.ts`) wires `auth`, `organisation`, `admin`, `wall` slices with serializable-check overrides for timestamps.
- Each slice manages async thunks hitting `VITE_API_BASE_URL`, keeping API calls consolidated.
- Feature directories (`src/features/*`) encapsulate page-level logic: profile editing, calls/projects, messaging UI, wall, admin dashboards.
- Super admin UI has distinct pages for organisations, users, calls/projects, dashboards, aligning with dual user system requirements.

Example slice reference:
```
1:290:apps/admin-panel/src/store/slices/authSlice.ts
- Handles login, registration steps, email/phone verification, token persistence, and super admin login.
```

Messaging service client:
```
1:394:apps/admin-panel/src/services/messagingService.ts
- Mirrors backend conversation endpoints (create, list, send, unread counts, activity notifications).
```

Wall slice for social feed:
```
1:324:apps/admin-panel/src/store/slices/wallSlice.ts
- Fetch, create, react, comment, delete posts with optimistic updates.
```

---

## Shared Package

`packages/shared` holds reusable TypeScript types/utilities consumed by both apps. Build with:
```bash
npm run build --workspace=packages/shared
```

---

## Data Model & Storage Strategy

```
1:205:apps/backend/src/types/index.ts
export interface Organisation {
    ...
    successStories?: string[];
    status: "draft" | "pending" | "approved" | "declined" | "suspended";
    ...
    lastLoginAt?: Date;
    loginCount?: number;
    suspendedAt?: Date;
}
```

- **Single collection policy**: All calls, projects, wall posts, success stories, and messaging metadata embed directly in organisation documents per project requirement.
- **Messaging collections**: `conversations`, `organisationConversations`, `messages` hold chat threads and indexes.
- **Verification**: `email_verifications` tracks codes with expiry; phone verification uses ephemeral in-memory cache (see Known Gaps).

---

## Quality & Tooling

- Root scripts:
  - `npm run dev` / `build` / `lint` / `type-check` / `clean`
- Backend: ESLint, strict TypeScript, rate limiting, Helmet.
- Manual QA flows:
  1. Registration (email + phone)
  2. Profile completion
  3. Admin approval
  4. Super admin suspension
  5. Messaging (create/send/read)
  6. Wall interactions

---

## Deployment Strategy

### Backend
1. `npm run build --workspace=apps/backend`.
2. Deploy `apps/backend/dist` + production dependencies to your Node host (Render, Railway, AWS, VM, etc.).
3. Set env vars (`JWT_SECRET`, `MONGODB_URI`, `SMTP_*`, `FRONTEND_URL`, `CORS_ORIGIN`).
4. Connect to MongoDB Atlas; enable TLS + IP allow list.
5. Run `node dist/index.js` (use PM2/systemd).
6. Health check: `GET /health`.

### Frontend
1. `npm run build --workspace=apps/admin-panel`.
2. Deploy `apps/admin-panel/dist` to Vercel/Netlify/S3+CloudFront.
3. Set `VITE_API_BASE_URL` to production API URL via host dashboard.

### Supporting Services
- **MongoDB Atlas** for managed database/backups.
- **SMTP** provider (matching SSL certificate host) for notifications.
- **AWS S3** bucket (`partnership-project-mainstorage`) for media uploads; configure credentials + optional CloudFront CDN as needed.

---

## Updates & Maintenance

- Monthly dependency review (`npm outdated`) followed by `npm install <pkg>@latest`.
- Rotate sensitive secrets (JWT, SMTP password) at least annually.
- Automate MongoDB backups (daily snapshot) and test restores quarterly.
- Run `npm run lint && npm run type-check && npm run build` before each release.
- Replace phone verification storage with persistent/SMS provider before high-scale production.
- Document platform changes in this README + `DUAL_USER_SYSTEM.md`.

---

## Key Commands & Scripts

| Target        | Command                                               |
|---------------|-------------------------------------------------------|
| Root dev      | `npm run dev`                                         |
| Root build    | `npm run build`                                       |
| Backend dev   | `npm run dev --workspace=apps/backend`                |
| Backend build | `npm run build --workspace=apps/backend`              |
| Backend start | `npm run start --workspace=apps/backend`              |
| Front dev     | `npm run dev --workspace=apps/admin-panel`            |
| Front build   | `npm run build --workspace=apps/admin-panel`          |
| Front preview | `npm run preview --workspace=apps/admin-panel`        |
| Shared build  | `npm run build --workspace=packages/shared`           |
| Super admin   | `npm run create:super-admin --workspace=apps/backend` |

---

## Core API Endpoints

| Area            | Endpoint (method)                         | Notes                                      |
|-----------------|-------------------------------------------|--------------------------------------------|
| Auth            | `POST /api/auth/login`                    | Organisation login                         |
|                 | `POST /api/auth/register/simple`          | Step 1 registration                        |
|                 | `POST /api/auth/register/step-2`          | Profile completion                         |
|                 | `POST /api/auth/admin/login`              | Super admin login                          |
|                 | `GET /api/auth/me`                        | Current user payload                       |
| Organisation    | `GET /api/organisation/browse`            | Filtered browse                            |
|                 | `GET /api/organisation/:id`               | Public details                             |
|                 | `GET /api/organisation/me/profile`        | Own profile                                |
| Admin           | `GET /api/admin/pending`                  | Pending review queue                       |
|                 | `POST /api/admin/review/:id`              | Approve/decline                            |
| Super Admin     | `GET /api/super-admin/organisations`      | Paginated list/search                      |
|                 | `POST /api/super-admin/organisations/:id/(suspend|unsuspend)` | Suspension workflow           |
| Messaging       | `POST /api/messaging/conversations`       | Create conversation                        |
|                 | `GET /api/messaging/conversations`        | Category-filtered listing                  |
|                 | `GET /api/messaging/conversations/:id/messages` | Paginated messages                    |
|                 | `GET /api/messaging/unread-count`         | Badge counters                             |
| Wall            | `GET /api/wall/posts`                     | Public feed                                |
|                 | `POST /api/wall/posts`                    | Create post (org only)                     |
|                 | `POST /api/wall/posts/:id/reactions`      | React to post                              |
|                 | `POST /api/wall/posts/:id/comments`       | Comment on post                            |

---

## Known Gaps & Next Steps

1. **S3 lifecycle & cleanup**: Add retention policies or scheduled jobs to remove orphaned wall/project images when records are deleted, and enable S3 lifecycle rules for cost control.
2. **Phone verification persistence**: SMS codes remain in memory; restarts clear pending verifications. Move to MongoDB + an SMS provider (e.g., Twilio Verify) for production resilience.
3. **Automated testing**: No unit/integration tests currently. Add Jest + Supertest coverage for auth, registration, admin review, messaging, and uploads.
4. **Legacy Firebase references**: This README reflects the MongoDB/S3 implementation; remove remaining Firebase references in code comments as progress allows.
5. **Monitoring & analytics**: Add structured logging/metrics (e.g., Winston + Loki/Grafana) for login/suspension/messaging events and S3 usage.

---

## Launch & Handover Checklist

1. Provision MongoDB Atlas and secure credentials.
2. Configure backend env vars (`JWT_SECRET`, Mongo URI, SMTP, CORS, FRONTEND_URL).
3. Run `npm run create:super-admin`, share credentials securely, and force password change after first login.
4. Deploy backend + verify `GET /health`.
5. Deploy frontend + set `VITE_API_BASE_URL`.
6. Seed organisations (if needed) via CSV importer.
7. Perform smoke tests end-to-end:
   - Registration steps + verifications
   - Admin approval flow
   - Super admin suspension/unsuspension
   - Messaging + unread counts
   - Wall post creation/reactions/comments
8. Verify S3 bucket/IAM configuration (correct bucket, lifecycle policies, least-privilege keys) and document remaining roadmap items (SMS verification, monitoring).
9. Schedule recurring maintenance (dependency updates, backups, log reviews).

---

**Built by Martin Andonovski (m.andonovski991@gmail.com) with ❤️ for Western Balkans Fund**