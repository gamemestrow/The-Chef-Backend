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
│   │   ├── auth.controller.ts      # Register, Login, Me, Change Password
│   │   ├── meal.controller.ts      # Upload Meal & Fetch Meal of the Day
│   │   ├── menuItem.controller.ts  # Fetch and Manage Menu Items (MenuItem table)
│   │   └── user.controller.ts      # User profile & Admin user management
│   │
│   ├── middlewares/                # Custom middlewares
│   │   ├── auth.middleware.ts      # JWT Authentication & Role-Based Access Control (RBAC)
│   │   └── error.middleware.ts     # Global centralized error handler
│   │
│   ├── models/                     # Neon Database Models & SQL Queries
│   │   ├── meal.model.ts           # Meal entity, SQL table init, DB queries
│   │   ├── menuItem.model.ts       # MenuItem entity, SQL table init, DB queries
│   │   └── user.model.ts           # User entity, SQL table init, DB queries
│   │
│   ├── routes/                     # API Routes
│   │   ├── auth.routes.ts          # /api/auth (register, login, me, change-password)
│   │   ├── meal.routes.ts          # /api/meals (upload, today)
│   │   ├── menuItem.routes.ts      # /api/menu-items (fetch all, single, create)
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
| Method | Endpoint | Access | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (`name`, `email`, `password`, `role`) | `{ "name": "...", "email": "...", "password": "...", "role": "chef" }` |
| `POST` | `/api/auth/login` | Public | Login with email & password | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/me` | Authenticated | Get logged-in user profile | None |
| `POST` / `PUT` | `/api/auth/change-password` | Authenticated | Change user password | `{ "currentPassword": "...", "newPassword": "..." }` |

### 🍽️ Menu Item Routes (`/api/menu-items`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/menu-items` | Public | Fetch all menu items (`?category=...`, `?isAvailable=true`, `?isFeatured=true`, `?search=...`) |
| `GET` | `/api/menu-items/:id` | Public | Fetch a single menu item by ID |
| `POST` | `/api/menu-items` | Chef / Admin | Create a new menu item |

### 🍲 Meal of the Day Routes (`/api/meals`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/meals/today` | Public | Fetch today's scheduled meals (`YYYY-MM-DD`) |
| `GET` | `/api/meals?date=YYYY-MM-DD` | Public | Fetch meals for any specific calendar date |
| `POST` | `/api/meals` | Chef / Admin | Upload scheduled meal (`name`, `image`, `quantity`, `date`) |

### 👤 User Routes (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Authenticated | View authenticated user profile |
| `GET` | `/api/users` | Admin Only | List all users |

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
