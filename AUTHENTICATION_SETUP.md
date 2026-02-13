# Google & Email Authentication Setup Guide

This guide explains how to set up and use the Google OAuth and email authentication system in BlockMusic.

## 🎯 **Overview**

BlockMusic now supports multiple authentication methods:
- **Google OAuth** - Quick login with Google account
- **Email/Password** - Traditional email authentication
- **Wallet Connect** - Web3 wallet authentication

## 📁 **Files Created/Modified**

### Backend Files
```
backend/
├── controllers/
│   └── authController.js          # Email & Google auth endpoints
├── models/
│   └── User.js                   # User model with auth fields
├── routes/
│   └── auth.js                   # Authentication routes
└── app.js                       # Updated to include auth routes
```

### Frontend Files
```
project/src/
├── services/
│   ├── emailAuth.ts              # Email authentication service
│   └── googleAuth.ts             # Updated Google OAuth service
└── components/
    └── AuthModal.tsx             # Updated with email auth integration
```

## 🔧 **Setup Instructions**

### 1. Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing one
   - Enable "Google+ API" and "Google Identity Toolkit API"

2. **Create OAuth Credentials**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Select "Web application"
   - Add authorized JavaScript origins: `http://localhost:3000` (for development)
   - Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`

3. **Get Client ID**
   - Copy the Client ID from the credentials page

### 2. Environment Variables

Create `.env` file in the `project/` directory:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:3000

# JWT Configuration (Backend)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=90d

# MongoDB (Backend)
MONGODB_URI=mongodb://localhost:27017/blockmusic
```

### 3. Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install mongoose jsonwebtoken crypto
   ```

2. **Start Backend Server**
   ```bash
   npm start
   ```

### 4. Frontend Setup

1. **Install Dependencies**
   ```bash
   cd project
   npm install
   ```

2. **Start Frontend Development Server**
   ```bash
   npm run dev
   ```

## 🚀 **API Endpoints**

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| POST | `/signup` | Email signup | No |
| POST | `/login` | Email login | No |
| POST | `/google` | Google OAuth | No |
| GET | `/me` | Get current user | Yes |
| PATCH | `/me` | Update profile | Yes |
| POST | `/logout` | Logout | Yes |

### Request/Response Examples

#### Email Signup
```javascript
POST /api/auth/signup
{
  "displayName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response:
{
  "status": "success",
  "token": "jwt_token_here",
  "data": {
    "user": {
      "_id": "user_id",
      "displayName": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

#### Google OAuth
```javascript
POST /api/auth/google
{
  "googleId": "google_user_id",
  "email": "user@gmail.com",
  "displayName": "John Doe",
  "photo": "profile_picture_url"
}
```

## 🔐 **Security Features**

### Password Security
- Passwords are hashed using SHA-256 before storage
- Minimum password length: 6 characters
- Password confirmation required for signup

### JWT Authentication
- JSON Web Tokens for secure authentication
- Configurable expiration (default: 90 days)
- Secure cookie storage in production

### Google OAuth Security
- State parameter to prevent CSRF attacks
- Token validation and revocation
- Secure redirect URI validation

## 🎨 **UI Components**

### AuthModal Features
- **Social Login Section**: Google OAuth button
- **Email Login Form**: Email/password inputs with validation
- **Wallet Connect**: Web3 wallet integration
- **Form Validation**: Real-time error messages
- **Loading States**: Visual feedback during authentication
- **Mode Switching**: Seamless login/signup toggle

### Authentication Flow
1. User opens AuthModal
2. Can choose between Google, Email, or Wallet login
3. Google OAuth redirects to Google consent screen
4. Email authentication validates credentials
5. Successful auth triggers wallet connection modal
6. User data stored in localStorage and JWT token

## 🔧 **Customization**

### Adding New Auth Providers
1. Create service in `src/services/`
2. Add controller methods in `backend/controllers/authController.js`
3. Update AuthModal to include new provider
4. Add environment variables for provider credentials

### User Model Extensions
The User model supports these fields:
- `displayName`: User's display name
- `email`: Email address (unique)
- `password`: Hashed password (optional for OAuth users)
- `googleId`: Google OAuth ID (optional)
- `photo`: Profile picture URL
- `role`: User role (user/artist/admin)
- `walletAddress`: Connected wallet address (optional)
- `emailVerified`: Email verification status

## 🐛 **Troubleshooting**

### Common Issues

1. **Google OAuth Not Working**
   - Check that Client ID is correct
   - Verify authorized origins in Google Cloud Console
   - Ensure environment variables are set

2. **Email Auth Fails**
   - Check backend is running on correct port
   - Verify MongoDB connection
   - Check JWT_SECRET is set

3. **CORS Issues**
   - Verify frontend URL is in CORS origins
   - Check API URL in environment variables

4. **Token Issues**
   - Clear localStorage if token is corrupted
   - Check JWT_SECRET matches between frontend/backend

### Debug Mode
Enable debug logging:
```bash
# Backend
DEBUG=auth:* npm start

# Frontend
VITE_DEBUG=true npm run dev
```

## 📱 **Testing**

### Test Authentication Flow
1. Start both backend and frontend servers
2. Open browser to `http://localhost:3000`
3. Click "Connect Wallet" or login button
4. Test each authentication method:
   - Google OAuth: Should redirect to Google
   - Email: Should validate and create JWT
   - Wallet: Should connect to Web3 wallet

### Test API Endpoints
```bash
# Test health check
curl http://localhost:5000/health

# Test email signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test User","email":"test@example.com","password":"password123","confirmPassword":"password123"}'
```

## 🚀 **Deployment**

### Environment Variables for Production
```env
# Production URLs
VITE_APP_URL=https://your-domain.com
VITE_API_URL=https://api.your-domain.com/api

# Production Google OAuth
VITE_GOOGLE_CLIENT_ID=production_client_id
VITE_GOOGLE_CLIENT_SECRET=production_client_secret

# Security
JWT_SECRET=super_secure_production_secret
NODE_ENV=production
```

### Security Headers
The application includes:
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input sanitization
- XSS protection

## 📚 **Additional Resources**

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://jwt.io/introduction/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

---

## ✅ **Summary**

The BlockMusic application now supports:
- ✅ **Google OAuth** authentication
- ✅ **Email/Password** authentication  
- ✅ **JWT-based** session management
- ✅ **Secure password** hashing
- ✅ **User profile** management
- ✅ **Wallet integration** after auth
- ✅ **Responsive UI** with loading states
- ✅ **Error handling** and validation
- ✅ **Production-ready** security features

Users can now authenticate using their preferred method while maintaining a consistent and secure experience across the platform.
