# The Chef Backend API

A clean, production-ready REST API backend built with **Node.js**, **Express.js**, **TypeScript**, and **Neon PostgreSQL Database** (`@neondatabase/serverless`).

---

## 📁 Folder Structure

```
The Chef Backend/
├── src/
│   ├── config/                        # Configuration
│   │   ├── db.ts                      # Neon Database connection pool & query helper
│   │   └── env.ts                     # Environment variables loader & validator
│   │
│   ├── controllers/                   # Request handlers
│   │   ├── auth.controller.ts         # Register, Login, Me, Change Password
│   │   ├── feedback.controller.ts     # Submit, List, Stats, My, Delete Feedback
│   │   ├── meal.controller.ts         # Upload Meal & Fetch Meal of the Day
│   │   ├── menuItem.controller.ts     # Fetch and Manage Menu Items (MenuItem table)
│   │   ├── notification.controller.ts # Student Notifications (with datetime)
│   │   └── user.controller.ts         # User profile & Admin user management
│   │
│   ├── middlewares/                   # Custom middlewares
│   │   ├── auth.middleware.ts         # JWT Authentication & Role-Based Access Control (RBAC)
│   │   └── error.middleware.ts        # Global centralized error handler
│   │
│   ├── models/                        # Neon Database Models & SQL Queries
│   │   ├── feedback.model.ts          # Feedback entity (comments, category, mealId)
│   │   ├── meal.model.ts              # Meal entity, SQL table init, DB queries
│   │   ├── menuItem.model.ts          # MenuItem entity, SQL table init, DB queries
│   │   ├── notification.model.ts      # Student Notification entity (with datetime)
│   │   └── user.model.ts              # User entity, SQL table init, DB queries
│   │
│   ├── routes/                        # API Routes
│   │   ├── auth.routes.ts             # /api/auth (register, login, me, change-password)
│   │   ├── feedback.routes.ts         # /api/feedback (submit, get all, stats, my, delete)
│   │   ├── meal.routes.ts             # /api/meals (upload, today)
│   │   ├── menuItem.routes.ts         # /api/menu-items (fetch all, single, create)
│   │   ├── notification.routes.ts     # /api/student-notifications (fetch, create, read-all)
│   │   ├── user.routes.ts             # /api/users
│   │   └── index.ts                   # Central router & /api/health
│   │
│   ├── services/                      # Business logic
│   │   └── meal.service.ts            # Meal fetching service
│   │
│   ├── types/                         # TypeScript definitions & UserRole enum
│   │   └── index.ts
│   │
│   ├── utils/                         # Utilities
│   │   └── jwt.ts                     # JWT token generator & verifier
│   │
│   ├── app.ts                         # Express application setup
│   └── server.ts                      # Server entrypoint & graceful shutdown
│
├── .env                               # Active environment variables (git-ignored)
├── .env.example                       # Environment template
├── .gitignore                         # Git ignore rules
├── package.json                       # Scripts and dependencies
└── tsconfig.json                      # TypeScript compiler configuration
```

---

## 📡 API Endpoints

### 🔔 Student Notification Routes (`/api/student-notifications`)
| Method | Endpoint | Access | Description | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/student-notifications` | Authenticated | Fetch notifications with `datetime` | `?isRead=false&type=meal_alert&limit=20` |
| `GET` | `/api/student-notifications/:id` | Authenticated | Fetch single notification | None |
| `POST` | `/api/student-notifications` | Chef / Admin | Create notification with `datetime` | `{ "title": "Lunch Ready!", "message": "Fresh pasta is served", "type": "meal_alert", "datetime": "2026-08-04T12:00:00Z" }` |
| `PATCH`| `/api/student-notifications/read-all` | Authenticated | Mark all notifications as read | None |
| `PATCH`| `/api/student-notifications/:id/read` | Authenticated | Mark single notification as read | None |
| `DELETE`| `/api/student-notifications/:id` | Owner / Admin / Chef | Delete notification | None |

### 💬 Feedback Routes (`/api/feedback`)
| Method | Endpoint | Access | Description | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/feedback` | Public / Auth | Submit feedback comment | `{ "comment": "Delicious food!", "category": "meal", "menuItemId": "..." }` |
| `GET` | `/api/feedback` | Public | List all feedbacks | `?category=meal&limit=20` |
| `GET` | `/api/feedback/stats` | Public | Total feedback statistics | None |
| `GET` | `/api/feedback/my` | Authenticated | Get current user's submitted feedbacks | None |
| `DELETE` | `/api/feedback/:id` | Owner / Admin | Delete feedback entry | None |

### 🍽️ Menu Item Routes (`/api/menu-items`)
| Method | Endpoint | Access | Description | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/menu-items` | Public | Fetch all menu items | `?categoryId=...&isAvailable=true&isFeatured=true&search=...` |
| `GET` | `/api/menu-items/:id` | Public | Fetch a single menu item by ID | None |
| `POST` | `/api/menu-items` | Chef / Admin | Create a new menu item | `{ "title": "...", "price": 12.99, "categoryId": "..." }` |

### 🔑 Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (`name`, `email`, `password`, `role`) | `{ "name": "...", "email": "...", "password": "...", "role": "chef" }` |
| `POST` | `/api/auth/login` | Public | Login with email & password | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/me` | Authenticated | Get logged-in user profile | None |
| `POST` / `PUT` | `/api/auth/change-password` | Authenticated | Change user password | `{ "currentPassword": "...", "newPassword": "..." }` |

### 🍲 Meal of the Day Routes (`/api/meals`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/meals/today` | Public | Fetch today's scheduled meals (`YYYY-MM-DD`) |
| `GET` | `/api/meals?date=YYYY-MM-DD` | Public | Fetch meals for any specific calendar date |
| `POST` | `/api/meals` | Chef / Admin | Upload scheduled meal (`name`, `image`, `quantity`, `date`) |

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
