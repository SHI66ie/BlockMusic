# Google Client ID Setup Guide

## 📍 **Where to Get Your Google Client ID**

### 1. **Go to Google Cloud Console**
- Visit: https://console.cloud.google.com/
- Sign in with your Google account
- Create a new project or select existing one

### 2. **Enable Required APIs**
In your project dashboard:
1. Go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - ✅ **Google+ API** (for user profile info)
   - ✅ **Google Identity Toolkit API** (for OAuth)
   - ✅ **People API** (optional, for user details)

### 3. **Create OAuth Credentials**
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
3. Select "Web application"
4. Fill in the form:
   - **Name**: BlockMusic Web App
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)

### 4. **Get Your Client ID**
After creating credentials:
- Your **Client ID** will be displayed
- Copy this ID for your environment variables

## 🔧 **Setup in BlockMusic**

### 1. **Update Environment Variables**
Create/update `.env` file in `project/` directory:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# API Configuration  
VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:3000
```

### 2. **For Artist Platform (Python)**
If you're also setting up the artist platform, update `artist-platform/.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 🎯 **Example Client ID Format**
Your Client ID will look like:
```
1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

## 🔍 **Finding Existing Credentials**

If you already have a project:
1. Go to https://console.cloud.google.com/
2. Select your project from the dropdown
3. Go to "APIs & Services" → "Credentials"
4. Look for "OAuth 2.0 Client IDs"
5. Click on your Web Application client to see the details

## ⚠️ **Important Notes**

### Development vs Production
- **Development**: Use `http://localhost:3000`
- **Production**: Use your actual domain
- **Both**: Must be added to authorized origins

### Security
- Never commit your Client Secret to git
- Use different Client IDs for dev/prod
- Keep your redirect URIs secure

## 🚀 **Quick Setup Steps**

1. **Create Project**: https://console.cloud.google.com/
2. **Enable APIs**: Google+ API, Google Identity Toolkit API
3. **Create Credentials**: OAuth 2.0 Client ID (Web Application)
4. **Configure Origins**: Add `http://localhost:3000`
5. **Copy Client ID**: From credentials page
6. **Update .env**: Add to your BlockMusic project

## 📱 **After Setup**

Once you have your Client ID:
1. Add it to your `.env` file
2. Restart your development server
3. Test Google OAuth on the home page
4. Verify authentication works correctly

## 🔧 **Troubleshooting**

### Common Issues:
- **"Invalid Client ID"**: Check for typos in your Client ID
- **"Redirect URI mismatch"**: Verify origins are correctly set
- **"API not enabled"**: Ensure required APIs are enabled

### Debug URLs:
- Google Cloud Console: https://console.cloud.google.com/
- OAuth Playground: https://developers.google.com/oauthplayground/

## 📋 **Checklist**

- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Enabled Google Identity Toolkit API  
- [ ] Created OAuth 2.0 Client ID
- [ ] Added localhost origins
- [ ] Copied Client ID
- [ ] Updated .env file
- [ ] Restarted development server
- [ ] Tested Google OAuth

---

## 📍 **Summary**

**Get your Google Client ID from**: https://console.cloud.google.com/

**Path**: APIs & Services → Credentials → OAuth 2.0 Client IDs

**Required for**: BlockMusic Google OAuth authentication

Once you have the Client ID, add it to your `.env` file and the Google signup will work! 🎉
