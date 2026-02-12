# Figma Plugin with Google OAuth Authentication

A complete Figma plugin implementation with Google OAuth authentication, featuring a modern UI and secure backend integration.

## 🎯 Features

- ✅ Google OAuth 2.0 authentication
- ✅ Secure token storage using Figma's `clientStorage`
- ✅ Session polling mechanism
- ✅ Modern, premium UI with animations
- ✅ User profile display
- ✅ Logout functionality
- ✅ Error handling and retry logic
- ✅ HTTPS-only communication (production)

## 📁 Project Structure

```
figma-oauth-plugin/
├── manifest.json          # Plugin configuration
├── code.js               # Main plugin logic (sandbox)
├── ui.html               # Plugin UI
├── styles.css            # UI styling
├── server/               # Backend server
│   ├── package.json
│   ├── server.js
│   └── .env.example
└── README.md
```

## 🚀 Setup Instructions

### 1. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** or **Google Identity Services**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - Add scopes: `profile`, `email`
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/auth/google/callback`
     - Production: `https://your-domain.com/auth/google/callback`
7. Copy the **Client ID** and **Client Secret**

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env

# Edit .env and add your Google OAuth credentials
# GOOGLE_CLIENT_ID=your-client-id
# GOOGLE_CLIENT_SECRET=your-client-secret

# Start the server
npm start
```

The server will run on `http://localhost:3000`

### 3. Plugin Setup

1. Open Figma Desktop App
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Select the `manifest.json` file from this project
4. The plugin will appear in your plugins list

### 4. Update URLs (if needed)

If your backend is not running on `localhost:3000`, update the `BACKEND_URL` in:
- `code.js` (line 3)
- `ui.html` (line 73)

## 🔧 Development

### Running the Backend

```bash
cd server
npm run dev  # Uses nodemon for auto-restart
```

### Testing the Plugin

1. Open Figma
2. Run the plugin: **Plugins** → **Development** → **Google OAuth Plugin**
3. Click "Sign in with Google"
4. Complete OAuth flow in the browser
5. Return to Figma - you should see your profile

## 🌐 Production Deployment

### Backend Deployment

1. **Choose a hosting service:**
   - Heroku
   - Railway
   - Vercel
   - DigitalOcean
   - AWS/GCP/Azure

2. **Set environment variables:**
   ```
   NODE_ENV=production
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   CALLBACK_URL=https://your-domain.com/auth/google/callback
   SESSION_SECRET=random-secret-string
   ```

3. **Update Google OAuth redirect URIs** in Google Cloud Console

### Plugin Updates for Production

1. Update `manifest.json`:
   ```json
   "networkAccess": {
     "allowedDomains": [
       "https://accounts.google.com",
       "https://oauth2.googleapis.com",
       "https://www.googleapis.com",
       "https://your-backend-domain.com"
     ]
   }
   ```
   **Remove** `http://localhost:3000`

2. Update `BACKEND_URL` in `code.js` and `ui.html`:
   ```javascript
   const BACKEND_URL = 'https://your-backend-domain.com';
   ```

3. Publish the plugin through Figma's plugin submission process

## 🔐 Security Best Practices

- ✅ All production endpoints use HTTPS
- ✅ Client secrets never exposed to frontend
- ✅ Tokens stored securely using `clientStorage`
- ✅ Session expiration (24 hours)
- ✅ CORS configured for Figma domains only
- ✅ Environment variables for sensitive data

## 📝 How It Works

### Authentication Flow

1. User clicks "Login with Google" in plugin UI
2. Plugin generates a unique session ID
3. Opens OAuth flow in new browser window
4. Backend redirects to Google OAuth consent screen
5. User approves permissions
6. Google redirects back to backend with auth code
7. Backend exchanges code for access token
8. Backend stores session data with session ID
9. Plugin polls backend for authentication status
10. Once authenticated, plugin receives and stores token
11. User profile is displayed in plugin

### Polling Mechanism

Due to Figma's sandboxed environment, the plugin cannot directly detect when OAuth completes. Instead:
- Plugin polls `/session-status` endpoint every 3 seconds
- Maximum polling time: 5 minutes
- Stops polling on success or timeout

## 🛠️ Troubleshooting

### "Network error" in plugin
- Ensure backend server is running
- Check that `BACKEND_URL` matches your server address
- Verify `allowedDomains` in `manifest.json`

### OAuth redirect fails
- Verify redirect URI in Google Cloud Console matches exactly
- Check `CALLBACK_URL` in `.env`
- Ensure no trailing slashes

### Session not found during polling
- OAuth flow may have failed
- Check backend logs for errors
- Verify Google OAuth credentials are correct

### Plugin doesn't load
- Ensure all files are in the same directory
- Check browser console for errors
- Verify `manifest.json` is valid JSON

## 📚 API Endpoints

### `GET /auth/google?session={sessionId}`
Initiates Google OAuth flow

### `GET /auth/google/callback`
Handles OAuth callback from Google

### `GET /session-status?session={sessionId}`
Returns authentication status for polling

### `POST /logout`
Clears user session
- Header: `Authorization: Bearer {token}`

## 🎨 Customization

### UI Styling
Edit `styles.css` to customize colors, fonts, and animations

### OAuth Scopes
Modify scopes in `server.js`:
```javascript
scope: ['profile', 'email', 'additional-scope']
```

### Session Duration
Change expiration in `server.js`:
```javascript
maxAge: 24 * 60 * 60 * 1000 // 24 hours
```

## 📄 License

MIT

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
