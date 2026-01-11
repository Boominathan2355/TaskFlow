# Deployment Guide

This guide explains how to deploy the TaskFlow application with:
- **Frontend (Client)** on **Render**
- **Backend (Server)** on **Vercel**

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│  Render         │  HTTP   │  Vercel         │
│  (Frontend)     │────────▶│  (Backend API)  │
│                 │         │                 │
└─────────────────┘         └─────────────────┘
```

---

## 🚀 Backend Deployment (Vercel)

### Prerequisites
- Vercel account ([vercel.com](https://vercel.com))
- MongoDB Atlas database (or other MongoDB instance)

### Step 1: Prepare Environment Variables

Create the following environment variables in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/taskflow` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key-here` |
| `CLIENT_URL` | Frontend URL (from Render) | `https://taskflow-frontend.onrender.com` |
| `NODE_ENV` | Environment mode | `production` |

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project root
cd d:\Product

# Deploy
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect the `vercel.json` configuration
4. Add environment variables in project settings
5. Click "Deploy"

### Step 3: Note Your Backend URL
After deployment, Vercel will provide a URL like:
```
https://your-project-name.vercel.app
```

**Save this URL** - you'll need it for the frontend configuration.

---

## 🎨 Frontend Deployment (Render)

### Prerequisites
- Render account ([render.com](https://render.com))
- Backend URL from Vercel (from previous step)

### Step 1: Update Environment Variable

Before deploying, update the `VITE_API_URL` in `client/.env.production`:

```bash
VITE_API_URL=https://your-backend-url.vercel.app
```

Or set it in Render's environment variables dashboard.

### Step 2: Deploy to Render

#### Option A: Using Render Dashboard
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New" → "Static Site"
3. Connect your Git repository
4. Render will auto-detect the `render.yaml` configuration
5. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.vercel.app`
6. Click "Create Static Site"

#### Option B: Using Render Blueprint
1. Push your code to Git
2. Go to Render Dashboard
3. Click "New" → "Blueprint"
4. Select your repository
5. Render will use the `render.yaml` file automatically

### Step 3: Note Your Frontend URL
After deployment, Render will provide a URL like:
```
https://taskflow-frontend.onrender.com
```

---

## 🔄 Update Backend CORS Settings

After getting your frontend URL, update the `CLIENT_URL` environment variable in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `CLIENT_URL` to your Render frontend URL
3. Redeploy the backend

---

## ✅ Verification

### 1. Test Backend API
```bash
curl https://your-backend-url.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-11T..."
}
```

### 2. Test Frontend
1. Visit your Render URL: `https://taskflow-frontend.onrender.com`
2. Try logging in
3. Check browser console for any API errors

### 3. Check Network Tab
- Open browser DevTools → Network tab
- Verify API calls are going to your Vercel backend URL
- Ensure no CORS errors

---

## 🔧 Configuration Files

### `render.yaml` (Frontend)
```yaml
services:
  - type: web
    name: taskflow-frontend
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/dist
    envVars:
      - key: VITE_API_URL
        sync: false
```

### `vercel.json` (Backend)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/server.js"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- ✅ Check `VITE_API_URL` is set correctly in Render
- ✅ Verify backend is deployed and accessible
- ✅ Check browser console for CORS errors
- ✅ Ensure `CLIENT_URL` is set in Vercel

### Backend API errors
- ✅ Check environment variables in Vercel
- ✅ Verify MongoDB connection string
- ✅ Check Vercel function logs

### Build failures
- ✅ Ensure all dependencies are in `package.json`
- ✅ Check build logs for specific errors
- ✅ Verify Node.js version compatibility

---

## 📝 Environment Variables Summary

### Vercel (Backend)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CLIENT_URL=https://taskflow-frontend.onrender.com
NODE_ENV=production
```

### Render (Frontend)
```
VITE_API_URL=https://your-backend.vercel.app
```

---

## 🔄 Continuous Deployment

Both platforms support automatic deployments:

- **Render**: Auto-deploys on push to main branch
- **Vercel**: Auto-deploys on push to main branch

Configure in each platform's settings to enable/disable auto-deployment.

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
