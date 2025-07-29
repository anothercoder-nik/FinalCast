# 🔧 Google OAuth Production Setup Guide

## Problem: "Access blocked: This app's request is invalid"

This error occurs because your Google OAuth app is configured for localhost but you're now using production URLs.

## ✅ Step-by-Step Fix:

### 1. **Update Google Cloud Console**

Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

#### **Authorized JavaScript Origins:**
Add these to your OAuth 2.0 client:
```
https://finalcast.onrender.com
https://finalcast1.onrender.com
```

#### **Authorized Redirect URIs:**
Add this exact URL:
```
https://finalcast1.onrender.com/api/auth/google/callback
```

### 2. **Backend Environment Variables**

Set these in your Render.com backend dashboard:

```env
NODE_ENV=production
FRONTEND_URL=https://finalcast.onrender.com
BACKEND_URL=https://finalcast1.onrender.com
GOOGLE_CALLBACK_URL=https://finalcast1.onrender.com/api/auth/google/callback
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

### 3. **Frontend Environment Variables**

Set these in your Render.com frontend dashboard:

```env
VITE_API_URL=https://finalcast1.onrender.com
```

### 4. **Verify OAuth Flow**

The complete OAuth flow should be:
1. User clicks "Sign in with Google" on `https://finalcast.onrender.com`
2. Redirects to `https://finalcast1.onrender.com/api/auth/google`
3. Google redirects to `https://finalcast1.onrender.com/api/auth/google/callback`
4. Backend redirects to `https://finalcast.onrender.com/dashboard`

## 🚨 **Important Notes:**

1. **Domain Verification**: You may need to verify domain ownership in Google Cloud Console
2. **OAuth Consent Screen**: Make sure your app is configured properly in the consent screen
3. **App Status**: Ensure your OAuth app is not in "Testing" mode if you want external users

## 🧪 **Testing:**

1. Clear browser cookies and localStorage
2. Try the OAuth flow from an incognito window
3. Check browser network tab for any redirect issues
4. Check backend logs for OAuth debugging info

## 🔍 **Common Issues:**

- **Mismatch in redirect URI**: Must exactly match what's in Google Console
- **Missing domain in origins**: Both frontend and backend domains needed
- **App in testing mode**: Limited to test users only
- **Cached credentials**: Clear browser data and try again

## 📝 **Environment Variable Checklist:**

Backend (Render.com):
- [ ] `GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set  
- [ ] `GOOGLE_CALLBACK_URL=https://finalcast1.onrender.com/api/auth/google/callback`
- [ ] `FRONTEND_URL=https://finalcast.onrender.com`
- [ ] `BACKEND_URL=https://finalcast1.onrender.com`

Frontend (Render.com):
- [ ] `VITE_API_URL=https://finalcast1.onrender.com`

Google Cloud Console:
- [ ] Authorized JavaScript origins include both domains
- [ ] Authorized redirect URIs include exact callback URL
- [ ] OAuth consent screen configured
- [ ] App published (not in testing mode)
