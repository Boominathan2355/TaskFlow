# TaskFlow Deployment Guide

## Deployment Architecture

Both **frontend** and **backend** are deployed on **Render** to support full Socket.io real-time features.

```
┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │
│  Render             │  HTTPS  │  Render             │
│  (Static Frontend)  │────────▶│  (Node.js Backend)  │
│                     │         │  + Socket.io ✅     │
└─────────────────────┘         └─────────────────────┘
```

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Configure Render deployment for both services"
git push
```

### Step 2: Deploy via Render Blueprint

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create both services

### Step 3: Configure Environment Variables

#### Backend Service

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/taskflow` |
| `JWT_SECRET` | `your-secret-key` |
| `CLIENT_URL` | `https://taskflow-frontend.onrender.com` |
| `NODE_ENV` | `production` (auto-set) |
| `PORT` | `10000` (auto-set) |

#### Frontend Service

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://taskflow-backend.onrender.com` |

### Step 4: Update Cross-References

After both services are deployed:

1. Get backend URL (e.g., `https://taskflow-backend.onrender.com`)
2. Update frontend `VITE_API_URL` environment variable
3. Get frontend URL (e.g., `https://taskflow-frontend.onrender.com`)
4. Update backend `CLIENT_URL` environment variable
5. Redeploy both services

---

## ✅ Verification

### Test Backend
```bash
curl https://taskflow-backend.onrender.com/api/health
```

### Test Frontend
1. Visit your frontend URL
2. Test login and features
3. Test real-time chat ✅
4. Test live notifications ✅

---

## 📝 Services Overview

### Frontend Service
- **Type:** Static Site
- **Build:** `cd client && npm install && npm run build`
- **Publish:** `./client/dist`

### Backend Service
- **Type:** Web Service (Node.js)
- **Build:** `cd server && npm install`
- **Start:** `cd server && npm start`
- **Port:** 10000
- **Features:** REST API + Socket.io WebSockets ✅

---

## 🔧 Configuration

- [`render.yaml`](file:///d:/Product/render.yaml) - Defines both services

---

## 🐛 Troubleshooting

**Services sleeping (Free Tier)**
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up

**Frontend can't connect to backend**
- Check `VITE_API_URL` is set correctly
- Verify backend is running
- Check CORS configuration

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Render Blueprints](https://render.com/docs/blueprint-spec)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
