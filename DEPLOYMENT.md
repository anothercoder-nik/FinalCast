# 🚀 Finalcast Deployment Guide

## Critical Deployment Fixes Applied ✅

### Route Issues Fixed:
- ✅ **Backend OAuth redirects**: Now use `FRONTEND_URL` environment variable
- ✅ **Frontend Google OAuth**: Dynamic API URL detection 
- ✅ **SPA routing**: Added _redirects and vercel.json for proper routing
- ✅ **Environment variables**: Corrected VITE_API_URL usage
- ✅ **Vite config**: Added SPA fallback configuration
- ✅ **CORS Configuration**: Added specific Render.com domains + debugging

## CORS Fix for Render.com Deployment

**Problem**: Frontend (`https://finalcast.onrender.com`) blocked from accessing backend (`https://finalcast1.onrender.com`)

**Solution Applied**:
```javascript
const allowedOrigins = [
    // Specific Render.com domains
    "https://finalcast.onrender.com",
    "https://finalcast1.onrender.com",
    // Plus regex patterns for flexibility
    /https:\/\/.*\.onrender\.com$/,
    // Environment variable support
    process.env.FRONTEND_URL,
    // Development fallbacks
    "http://localhost:5173",
]
```

## Environment Setup

### Frontend (.env.production)
```env
VITE_API_URL=https://finalcast1.onrender.com
```

### Backend (.env.production)
```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://finalcast.onrender.com
BACKEND_URL=https://finalcast1.onrender.com
GOOGLE_CALLBACK_URL=https://finalcast1.onrender.com/api/auth/google/callback
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-secure-jwt-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

## Google OAuth Configuration Fix

**Problem**: "Access blocked: This app's request is invalid"

**Solution**: Update Google Cloud Console with production URLs:

1. **Authorized JavaScript Origins**:
   - `https://finalcast.onrender.com`
   - `https://finalcast1.onrender.com`

2. **Authorized Redirect URIs**:
   - `https://finalcast1.onrender.com/api/auth/google/callback`

See `GOOGLE_OAUTH_FIX.md` for detailed setup instructions.

## Deployment Steps

### 1. Backend Deployment
```bash
# Install dependencies
cd backend
npm install

# Start production server
npm start
```

### 2. Frontend Deployment
```bash
# Install dependencies
cd frontend
npm install

# Build for production
npm run build

# Deploy the dist/ folder to your hosting service
```

## Platform-Specific Instructions

### Render.com
1. **Backend**: Deploy from GitHub, set environment variables
2. **Frontend**: Deploy as static site from the `frontend/dist` folder

### Vercel
1. **Backend**: Deploy as Node.js function
2. **Frontend**: Deploy with automatic build detection (vercel.json included)

### Netlify
1. **Backend**: Deploy as serverless functions or separate service
2. **Frontend**: Deploy with SPA redirect rules (_redirects file included)

### Railway/Heroku
1. Set up both frontend and backend as separate services
2. Configure environment variables in dashboard

## Important Notes

✅ **OAuth Fixed**: Google OAuth now works in production with environment-based redirects
✅ **SPA Routing**: Frontend routes work correctly when refreshed/accessed directly  
✅ **CORS Configuration**: Automatically handles common deployment patterns
✅ **WebRTC Ready**: Full WebRTC + Socket.IO support for video podcasting
✅ **Environment Variables**: Smart fallbacks for different environments
✅ **Connection Resilience**: Automatic reconnection and error handling

## Testing Deployment

1. ✅ Verify frontend connects to backend API
2. ✅ Test Socket.IO connection in browser console  
3. ✅ Verify WebRTC video/audio streaming works
4. ✅ Check authentication flow (Google OAuth with correct redirects)
5. ✅ Test all frontend routes work when accessed directly
6. ✅ Verify session creation and joining functionality
