# TaskFlow Deployment Guide

## Deployment Architecture

- **Frontend:** Render (Static Site)
- **Backend:** Vercel (Serverless Functions)

> [!WARNING]
> **Socket.io Real-Time Features Not Available**
> 
> Vercel's serverless architecture doesn't support persistent WebSocket connections. Real-time chat, live notifications, and instant task updates will not work. All REST API endpoints function normally.

```
┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │
│  Render             │  HTTPS  │  Vercel             │
│  (Static Frontend)  │────────▶│  (Serverless API)   │
│                     │         │  (No Socket.io)     │
└─────────────────────┘         └─────────────────────┘
```

---

## 🚀 Backend Deployment (Vercel)

### Step 1: Deploy to Vercel

**Option A: Vercel CLI**
```bash
npm i -g vercel
cd d:\Product
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel auto-detects `vercel.json`
4. Deploy

### Step 2: Configure Environment Variables

Add these in Vercel project settings:

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/taskflow` |
| `JWT_SECRET` | `your-secret-key` |
| `CLIENT_URL` | `https://taskflow-frontend.onrender.com` |

### Step 3: Save Backend URL

Example: `https://taskflow-backend.vercel.app`

---

## 🎨 Frontend Deployment (Render)

### Step 1: Update Environment Variable

Set `VITE_API_URL` in `client/.env.production`:
```bash
VITE_API_URL=https://your-backend.vercel.app
```

### Step 2: Deploy to Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New" → "Static Site"
3. Connect your Git repository
4. Render auto-detects `render.yaml`
5. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: Your Vercel backend URL
6. Deploy

### Step 3: Update Backend CORS

Update `CLIENT_URL` in Vercel with your Render frontend URL and redeploy.

---

## ✅ Verification

### Test Backend
```bash
curl https://your-backend.vercel.app/api/health
```

### Test Frontend
1. Visit your Render URL
2. Test login and basic features
3. Check browser console for errors

---

## 📝 Configuration Files

- [`render.yaml`](file:///d:/Product/render.yaml) - Frontend deployment
- [`vercel.json`](file:///d:/Product/vercel.json) - Backend deployment
- [`api/index.js`](file:///d:/Product/api/index.js) - Serverless entry point
- [`client/.env.production`](file:///d:/Product/client/.env.production) - Production env vars

---

## 🐛 Troubleshooting

**Frontend can't connect to backend**
- Check `VITE_API_URL` is set correctly
- Verify backend is accessible
- Check CORS configuration

**Backend errors**
- Verify environment variables in Vercel
- Check MongoDB connection
- Review Vercel function logs

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
