# The Chef Backend API

A clean, production-ready REST API backend built with **Node.js**, **Express.js**, **TypeScript**, and **Neon PostgreSQL Database** (`@neondatabase/serverless`).

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
│   │   ├── auth.controller.ts      # Register, Login, Current User (Me)
│   │   ├── meal.controller.ts      # Upload Meal & Fetch Meal of the Day
│   │   └── user.controller.ts      # User profile & Admin user management
│   │
│   ├── middlewares/                # Custom middlewares
│   │   ├── auth.middleware.ts      # JWT Authentication & Role-Based Access Control (RBAC)
│   │   └── error.middleware.ts     # Global centralized error handler
│   │
│   ├── models/                     # Neon Database Models & SQL Queries
│   │   ├── meal.model.ts           # Meal entity, SQL table init, DB queries
│   │   └── user.model.ts           # User entity, SQL table init, DB queries
│   │
│   ├── routes/                     # API Routes
│   │   ├── auth.routes.ts          # /api/auth (register, login, me)
│   │   ├── meal.routes.ts          # /api/meals (upload, today)
│   │   ├── user.routes.ts          # /api/users
│   │   └── index.ts                # Central router & /api/health
│   │
│   ├── services/                   # Business logic
│   │   └── meal.service.ts         # Meal fetching service
│   │
│   ├── types/                      # TypeScript definitions & UserRole enum
│   │   └── index.ts
│   │
│   ├── utils/                      # Utilities
│   │   └── jwt.ts                  # JWT token generator & verifier
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

## 📡 API Endpoints

### 🔑 Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (`name`, `email`, `password`, `role`) |
| `POST` | `/api/auth/login` | Public | Login with email & password, returns JWT token |
| `GET` | `/api/auth/me` | Authenticated | Get current logged-in user profile |

### 🍲 Meal Routes (`/api/meals`)
| Method | Endpoint | Access | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/meals` | Chef / Admin | Upload meal to database | `{ "name": "Pasta", "image": "https://...", "quantity": 10, "date": "2026-08-03" }` |
| `POST` | `/api/meals/upload` | Chef / Admin | Alias route for meal upload | Same as above |
| `GET` | `/api/meals/today` | Public | Fetch today's meals (`YYYY-MM-DD`) | None |
| `GET` | `/api/meals?date=YYYY-MM-DD` | Public | Fetch meals for any specific calendar date | None |

### 👤 User Routes (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Authenticated | View authenticated user profile |
| `GET` | `/api/users` | Admin Only | List all users (supports `?role=chef`) |

---

## 🚀 Getting Started

1. Add your Neon connection string in `.env`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=your_jwt_secret
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
