# The Chef Backend API

A clean, modular, production-ready REST API backend built with **Node.js**, **Express.js**, **TypeScript**, and **Neon PostgreSQL Database** (`@neondatabase/serverless`).

This backend is tailored to serve **3 distinct client applications / roles**:
1. 👨‍🍳 **Chef App**: Course management, recipe creation, chef profile.
2. 🎓 **Student App**: Course exploration, enrollment, learning progress.
3. 🛡️ **Admin App**: User administration, platform metrics, and system controls.

---

## 📁 Folder Structure

```
The Chef Backend/
├── src/
│   ├── config/                     # Core configs
│   │   ├── env.ts                  # Typed environment variable loader
│   │   └── db.ts                   # Neon Database connection pool & query helpers
│   │
│   ├── middlewares/                # Shared middlewares
│   │   ├── auth.middleware.ts      # Authentication & Role-Based Access Control (RBAC)
│   │   ├── error.middleware.ts     # Global centralized error handler
│   │   └── notFound.middleware.ts  # 404 handler
│   │
│   ├── modules/                    # Feature/Role-based business modules
│   │   ├── auth/                   # Shared Authentication (Register/Login)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.service.ts
│   │   ├── chef/                   # 👨‍🍳 Chef Module
│   │   │   ├── chef.controller.ts
│   │   │   ├── chef.routes.ts
│   │   │   └── chef.service.ts
│   │   ├── student/                # 🎓 Student Module
│   │   │   ├── student.controller.ts
│   │   │   ├── student.routes.ts
│   │   │   └── student.service.ts
│   │   ├── admin/                  # 🛡️ Admin Module
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── admin.service.ts
│   │   └── health/                 # 🩺 Health & Neon DB ping
│   │       ├── health.controller.ts
│   │       └── health.routes.ts
│   │
│   ├── routes/                     # Central router aggregator
│   │   └── index.ts                # Mounts /auth, /chef, /student, /admin, /health
│   │
│   ├── types/                      # TypeScript definitions & UserRole enum
│   │   └── index.ts
│   │
│   ├── utils/                      # Utilities
│   │   ├── apiError.ts             # Standard error class
│   │   └── apiResponse.ts          # Standard JSON response formatter
│   │
│   ├── app.ts                      # Express app setup & middleware pipeline
│   └── server.ts                   # Server bootstrap & graceful shutdown
│
├── .env                            # Active environment variables (git-ignored)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # Scripts and dependencies
├── tsconfig.json                   # TypeScript compiler configuration
└── README.md                       # Project documentation
```

---

## 🚀 Getting Started

### 1. Configure Neon Database
1. Create a serverless PostgreSQL database at [Neon Console](https://console.neon.tech).
2. Copy your connection string.
3. Update `.env`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Available Scripts

- **Development Mode (Fast watch with TSX)**:
  ```bash
  npm run dev
  ```
- **Type Checking**:
  ```bash
  npm run typecheck
  ```
- **Production Build**:
  ```bash
  npm run build
  ```
- **Start Production Server**:
  ```bash
  npm start
  ```

---

## 📡 API Endpoints Overview

| Area | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/` | Root status message |
| **System** | `GET` | `/api/v1/health` | Health check & Neon DB connection status |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new user (Chef / Student / Admin) |
| **Auth** | `POST` | `/api/v1/auth/login` | User login |
| **Chef** | `GET` | `/api/v1/chef/profile` | Get chef profile |
| **Chef** | `GET` | `/api/v1/chef/courses` | Get courses created by chef |
| **Chef** | `POST` | `/api/v1/chef/courses` | Create new course |
| **Student** | `GET` | `/api/v1/student/profile` | Get student profile |
| **Student** | `GET` | `/api/v1/student/courses` | Get enrolled courses & progress |
| **Student** | `POST` | `/api/v1/student/enroll` | Enroll in a course |
| **Admin** | `GET` | `/api/v1/admin/metrics` | Platform overview metrics |
| **Admin** | `GET` | `/api/v1/admin/users` | List & filter users |
| **Admin** | `PATCH` | `/api/v1/admin/users/:userId/status` | Update user status |
