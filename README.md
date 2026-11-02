# OmniMart — Full-Stack E-Commerce Platform

OmniMart is a modern, responsive full-stack e-commerce web application engineered for portfolio demonstration. It provides an end-to-end shopping experience featuring product discovery, basket and wishlist management, promo code validation, checkout order flow, and a comprehensive administrator dashboard.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: NestJS 11, Node.js, Express, Passport JWT, BcryptJS
- **Data Layer**: File-based persistent JSON storage (`backend/data/*.json`)
- **Deployment Targets**: Render (Web Service for Backend) & Vercel (SPA for Frontend)

---

## ✨ Features

- **Authentication & Roles**: Secure JWT authentication with role-based access control (`admin` vs. `user`).
- **Product Catalog**: Live search, category filtering, stock tracking, and pricing calculations.
- **Cart & Wishlist**: Persistent client-side cart and wishlist state synced with user profile.
- **Promo Codes**: Dynamic discount calculation and coupon code verification.
- **Order Flow**: Real-time order placement with tracking and history.
- **Admin Dashboard**: Manage inventory, update product listings, view incoming customer orders, and inspect user accounts.
- **Health Monitoring**: Dedicated unauthenticated `/health` endpoint for uptime checks.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 2. Installation
Install dependencies across both backend and frontend from the root:
```bash
npm run install:all
```

### 3. Environment Setup
Copy the example environment configurations:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Review and adjust `backend/.env`:
```env
PORT=3001
JWT_SECRET="your_secure_random_jwt_secret"
FRONTEND_URL="http://localhost:5173"
DEMO_PASSWORD="your_demonstration_password"
```

### 4. Run Development Servers
Start both the NestJS API and the Vite frontend concurrently:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

---

## 👥 Demo Accounts & Access

The application comes pre-populated with demonstration accounts stored in `backend/data/users.json`. All passwords are encrypted with bcrypt hashes. In compliance with security standards, plaintext passwords are not committed to source control.

| Role | Account Name | Email | Password Reference |
| :--- | :--- | :--- | :--- |
| **Admin** | Gaurav Bhoria | `gauravbhoria07@gmail.com` | Configured via `DEMO_PASSWORD` in `.env` |
| **Admin** | Isha Dubey | `isha@gmail.com` *(or `isha@gmailcom`)* | Configured via `DEMO_PASSWORD` in `.env` |
| **Admin** | Admin Fixer | `admin_fix@omnimart.com` | Configured via `DEMO_PASSWORD` in `.env` |
| **Customer** | Disha | `disha@gmail.com` | Configured via `DEMO_PASSWORD` in `.env` |

> [!TIP]
> To sign into any demonstration account during local testing, use the password configured in your local `backend/.env` file (`DEMO_PASSWORD`). For cloud deployment on Render, supply your chosen demo password in the Render environment variables.

---

## 📦 Deployment Guide

OmniMart is pre-configured for zero-cost cloud deployment:
- **Backend**: Render Web Service ([render.yaml](render.yaml))
- **Frontend**: Vercel SPA ([frontend/vercel.json](frontend/vercel.json))

For step-by-step instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🧪 Testing

Run backend unit and controller tests:
```bash
npm test --prefix backend
```

Build and typecheck verification:
```bash
npm run build
```

