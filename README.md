# Figma OAuth Plugin

A production-ready Figma plugin that implements Google OAuth 2.0 authentication. Users can securely sign in with their Google account, and the plugin maintains persistent sessions across plugin launches.

## Features

- **Google OAuth 2.0** - Secure authentication flow
- **Persistent Sessions** - Login state saved using Figma's clientStorage
- **Modern UI** - Clean interface with loading states and user profiles
- **Session Polling** - Automatic detection when OAuth completes in browser
- **Production Ready** - Deployed backend on Railway with HTTPS

## How It Works

The plugin opens a browser window for Google sign-in, polls the backend for authentication status, then stores the user's token securely in Figma. Once authenticated, the plugin displays the user's profile and maintains the session.

## Setup

### 1. Google Cloud Console

1. Create OAuth 2.0 Client ID at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized redirect URI:
   ```
   https://figma-oauth-plugin-production.up.railway.app/auth/google/callback
   ```
3. Copy Client ID and Client Secret

### 2. Backend Configuration

Set environment variables on Railway:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
CALLBACK_URL=https://figma-oauth-plugin-production.up.railway.app/auth/google/callback
SESSION_SECRET=random-secret-string
```

### 3. Import Plugin to Figma

1. Open Figma Desktop App
2. **Plugins** → **Development** → **Import plugin from manifest**
3. Select `manifest.json`

## Usage

1. Run plugin: **Plugins** → **Development** → **Google OAuth Plugin**
2. Click "Sign in with Google"
3. Complete OAuth in browser
4. Return to Figma

## Troubleshooting

**Error 400: redirect_uri_mismatch**
- Add exact callback URL to Google Cloud Console authorized redirect URIs
- Wait 5 minutes after saving

**All views showing at once**
- Close plugin
- Remove and re-import plugin in Figma

**Network error**
- Verify backend is running: https://figma-oauth-plugin-production.up.railway.app/
- Check `allowedDomains` in `manifest.json`

## Development

**Local backend:**
```bash
cd backend
npm install
npm start
```

Update `BACKEND_URL` in `code.js` and `ui.html` to `http://localhost:3000`

## Project Structure

```
├── manifest.json    # Plugin config
├── code.js         # Main logic
├── ui.html         # UI
├── styles.css      # Styling
└── backend/
    └── server.js   # OAuth server
```

## API Endpoints

- `GET /auth/google?session={id}` - Start OAuth
- `GET /session-status?session={id}` - Check auth status
- `POST /logout` - Clear session
