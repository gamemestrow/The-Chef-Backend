# The Chef Backend API

A clean, minimal, production-ready REST API backend built with **Node.js**, **Express.js**, **TypeScript**, and **Neon PostgreSQL Database** (`@neondatabase/serverless`).

---

## 📁 Folder Structure

```
The Chef Backend/
├── src/
│   ├── config/                     # Configuration
│   │   ├── db.ts                   # Neon Database connection pool & query helper
│   │   └── env.ts                  # Environment variables loader & validator
│   │
│   ├── controllers/                # Request handlers
│   │   ├── auth.controller.ts      # Authentication (Chef, Student, Admin)
│   │   └── user.controller.ts      # User profile & management
│   │
│   ├── middlewares/                # Custom middlewares
│   │   ├── auth.middleware.ts      # Authentication & Role-based guards
│   │   └── error.middleware.ts     # Centralized error handler
│   │
│   ├── routes/                     # API Routes
│   │   ├── auth.routes.ts          # /api/auth
│   │   ├── user.routes.ts          # /api/users
│   │   └── index.ts                # Central router & /api/health
│   │
│   ├── types/                      # TypeScript definitions & UserRole enum
│   │   └── index.ts
│   │
│   ├── app.ts                      # Express application setup
│   └── server.ts                   # Server entrypoint & graceful shutdown
│
├── .env                            # Active environment variables (git-ignored)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # Scripts and dependencies
└── tsconfig.json                   # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### 1. Set Up Neon Database
1. Go to [Neon Console](https://console.neon.tech) and copy your connection string.
2. In `.env`, add your connection string:
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Available Commands

- **Development Server (Hot-reload)**:
  ```bash
  npm run dev
  ```
- **Type Checking**:
  ```bash
  npm run typecheck
  ```
- **Build**:
  ```bash
  npm run build
  ```
- **Start Production**:
  ```bash
  npm start
  ```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API status |
| `GET` | `/api/health` | Server and Neon DB connection status |
| `POST` | `/api/auth/register` | Register user (`role`: chef / student / admin) |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/users/profile` | Authenticated user profile |
| `GET` | `/api/users` | Admin only: Get all users |
