# OmniMart Portfolio Deployment & Operations Guide

This guide details the streamlined, zero-cost deployment architecture for **OmniMart** as a public portfolio demonstration on **Render** (NestJS backend) and **Vercel** (React 19 + Vite frontend), using lightweight JSON storage for demo data.

---

## 1. Project Architecture

```
                  +----------------------------------------------+
                  |               User / Recruiter               |
                  +----------------------------------------------+
                                    |          |
                   HTTPS (Assets)   |          | HTTPS / REST API
                                    v          v
          +-------------------------------+  +-------------------------------+
          |         Vercel CDN            |  |       Render Web Service      |
          |   (React 19 + Vite Frontend)  |  |      (NestJS 11 Backend)      |
          |   SPA with Rewrites & Headers |  |   Validation / JWT / Throttler|
          +-------------------------------+  +-------------------------------+
                                                             |
                                                             | File I/O
                                                             v
                                             +-------------------------------+
                                             |       Demo JSON Storage       |
                                             |     (backend/data/*.json)     |
                                             |   Users, Products, Orders     |
                                             +-------------------------------+
```

### Component Overview
* **Frontend**: React 19, TypeScript, Vite. Glassmorphic responsive UI, product catalog with category filter & live search, cart drawer, checkout modal, order history, and admin dashboard. Deployed to Vercel.
* **Backend**: NestJS 11, Node.js, Express, Passport JWT, BcryptJS password hashing, class-validator request validation, Throttler rate limiting, and global exception filter. Configured to listen on `0.0.0.0` with dynamic CORS and health checks. Deployed to Render.
* **Data Storage**: Direct local JSON storage (`backend/data/*.json`). Pre-populated with demo products, users (including admin accounts), sample orders, and promo codes.
* **Database Dependency**: **None required**. No external PostgreSQL, Neon, or Supabase account is needed.

---

## 2. Understanding JSON Storage on Render (Portfolio Demonstration)

> [!NOTE]
> Render free web services use an ephemeral container filesystem.
>
> Any changes made while exploring the live app (such as placing a new test order, creating a promo code, or updating an address) are saved in memory and written to the local JSON files. When Render restarts the container (e.g., after 15 minutes of inactivity or during a new deployment), the filesystem resets cleanly back to the committed demo state.
>
> For a **portfolio demonstration project**, this is an ideal feature: recruiters and interviewers always see a clean, working storefront with pre-seeded demo items and working admin accounts.

---

## 3. Required Environment Variables

### 3.1 Backend Variables (Configured on Render Dashboard)

| Variable | Required | Description | Example Value |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `PORT` | Optional | Port Render uses (Render auto-injects `10000`, local defaults to `3001`) | `3001` |
| `JWT_SECRET` | Yes | 32+ character random secret for JWT signing | `e9f2a0b4d1c87e65f3a1290847cb56123498ef01ab78cd23` *(Render can auto-generate)* |
| `FRONTEND_URL` | Yes | Deployed Vercel frontend URL for CORS | `https://your-omnimart-app.vercel.app` |

### 3.2 Frontend Variables (Configured on Vercel Dashboard)

| Variable | Required | Description | Example Value |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | Live backend HTTPS URL on Render (no trailing slash) | `https://omnimart-backend.onrender.com` |

---

## 4. Local Development

### Prerequisites
* Node.js `v20.x` or higher
* npm `v10.x` or higher

### Commands
1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Configure environment files**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start development servers (Both Frontend & Backend concurrently)**:
   ```bash
   npm run dev
   ```
   * Frontend: `http://localhost:5173`
   * Backend API: `http://localhost:3001`
   * Health Check: `http://localhost:3001/health`

---

## 5. Seeded Demo Accounts

Pre-configured in `backend/data/users.json` for testing. All accounts are stored as secure bcrypt hashes. In accordance with security standards, plaintext passwords are not committed to source control:

| Role | Name | Email | Password Reference |
| :--- | :--- | :--- | :--- |
| **Admin** | Gaurav Bhoria | `gauravbhoria07@gmail.com` | Configured via `DEMO_PASSWORD` (see `.env` / Render env) |
| **Admin** | Isha Dubey | `isha@gmail.com` *(or `isha@gmailcom`)* | Configured via `DEMO_PASSWORD` (see `.env` / Render env) |
| **Admin** | Admin Fixer | `admin_fix@omnimart.com` | Configured via `DEMO_PASSWORD` (see `.env` / Render env) |
| **Customer** | Disha | `disha@gmail.com` | Configured via `DEMO_PASSWORD` (see `.env` / Render env) |

> [!NOTE]
> All demo accounts share a unified demonstration-only bcrypt hash. To log in during local evaluation or deployment, specify your chosen demo password in `DEMO_PASSWORD` (local `backend/.env` or Render environment settings).

---

## 6. GitHub Repository Setup

1. **Initialize Git** in the project root:
   ```bash
   git init
   git add .
   git commit -m "feat: prepare OmniMart for portfolio deployment on Render and Vercel"
   ```

2. **Verify no secrets are committed**:
   The root `.gitignore` automatically prevents `.env`, `node_modules`, `dist`, and temporary files from being committed.

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

---

## 7. Backend Deployment on Render

### Method A: Automated via Render Blueprint (`render.yaml`)
1. Log in to [https://dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render detects [`render.yaml`](file:///d:/projects/ecommerce/render.yaml) automatically:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start:prod`
   * **Health Check Path**: `/health`
5. Supply `FRONTEND_URL` (your planned Vercel URL, or enter a temporary value and update after Vercel deploys).
6. Click **Apply**.

### Method B: Manual Web Service Setup
1. On Render, click **New +** -> **Web Service**.
2. Select your repository.
3. Configure settings:
   * **Name**: `omnimart-backend`
   * **Region**: `Oregon (US West)` (or closest region)
   * **Branch**: `main`
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start:prod`
   * **Health Check Path**: `/health`
4. In **Environment Variables**:
   * `NODE_ENV`: `production`
   * `PORT`: `3001`
   * `JWT_SECRET`: Generate a 32+ character random string (or use Render's "Generate" button)
   * `FRONTEND_URL`: `https://your-omnimart-app.vercel.app`
5. Click **Create Web Service**.
6. Once deployed, copy your service URL (e.g., `https://omnimart-backend-xxxx.onrender.com`).
7. Verify health: `curl https://omnimart-backend-xxxx.onrender.com/health`.

---

## 8. Frontend Deployment on Vercel

1. Log in to [https://vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. In Project Configuration:
   * **Root Directory**: Click **Edit** and choose `frontend`.
   * **Framework Preset**: `Vite`.
   * **Build Command**: `npm run build` *(executes `tsc -b && vite build`)*.
   * **Output Directory**: `dist`.
4. In **Environment Variables**:
   * **Name**: `VITE_API_URL`
   * **Value**: `https://<your-render-backend-url>.onrender.com` *(no trailing slash)*.
5. Click **Deploy**.
6. Once deployment finishes, copy your live Vercel URL (e.g. `https://omnimart-frontend.vercel.app`).

---

## 9. Final CORS Handshake

1. Go to your backend on the Render Dashboard -> **Environment**.
2. Update `FRONTEND_URL` to match your live Vercel domain (e.g., `https://omnimart-frontend.vercel.app`).
3. Save changes. Render redeploys within seconds with the updated CORS rule.

---

## 10. Live Verification Checklist

Once both services are deployed:
- [ ] Open `https://<your-backend>.onrender.com/health` -> Confirms `status: "ok"`.
- [ ] Open your live Vercel site -> Confirms product cards and categories render smoothly.
- [ ] Sign in with admin: `gauravbhoria07@gmail.com` using the configured `DEMO_PASSWORD` -> Navbar displays the **Admin** pill.
- [ ] Open the **Admin** tab -> Verify overview analytics, catalog management, and order list.
- [ ] Add an item to cart and complete a test checkout.
- [ ] Sign out and test user registration with a new account.

---

## 11. Troubleshooting

* **Render Free Plan Spin-Down**: Free Render web services spin down after 15 minutes of inactivity. The initial request can take 30-50 seconds to wake up. This is standard behavior for Render's free tier.
* **CORS Blocked**: If you see CORS errors in the browser console, ensure `FRONTEND_URL` on Render matches your exact Vercel URL including `https://` without a trailing slash.
* **404 on Refresh**: `frontend/vercel.json` contains SPA rewrite rules so refreshing pages or deep links routes directly to `index.html`.
