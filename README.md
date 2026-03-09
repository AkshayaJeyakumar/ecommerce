# 🧠 Adaptive AI Dynamic Pricing Platform

A startup-grade AI SaaS dashboard demonstrating dynamic pricing intelligence for e-commerce.

## 📁 Project Structure

```
ecommerce/
├── backend/          ← Node.js + Express API (port 5000)
│   ├── server.js
│   └── data/db.json  ← Mock database
└── frontend/         ← React + Vite + Tailwind (port 5173)
    └── src/
        ├── App.jsx
        ├── components/   (Layout, Sidebar, Header)
        └── pages/        (11 pages)
```

## ▶️ How to Run

### Step 1 — Start the Backend

Open a terminal and run:

```bash
cd ecommerce/backend
npm start
```

You should see:
```
🚀 AI Pricing API running at http://localhost:5000
```

### Step 2 — Start the Frontend

Open a **second** terminal and run:

```bash
cd ecommerce/frontend
npm run dev
```

You should see:
```
VITE ready in 600ms
➜  Local: http://localhost:5173/
```

### Step 3 — Open the Browser

Go to: **http://localhost:5173**

---

## 🔑 Login Credentials

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | Admin |
| john     | john123   | User  |
| sara     | sara123   | User  |

---

## 📄 Pages

| Page | Route |
|------|-------|
| Login | `/login` |
| Dashboard | `/dashboard` |
| Products | `/products` |
| AI Pricing Engine | `/pricing` |
| Price Simulator | `/simulator` |
| Sentiment Analysis | `/sentiment` |
| Competitor Tracker | `/competitor` |
| Analytics | `/analytics` |
| Admin Panel | `/admin` |
| Workflow Visualizer | `/workflow` |
| Settings | `/settings` |

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite 7 + TailwindCSS v4 + Framer Motion + Chart.js
- **Backend:** Node.js + Express 5
- **Database:** JSON mock (`backend/data/db.json`)
