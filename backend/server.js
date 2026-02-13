require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory session store (use Redis in production)
const sessions = new Map();

// Middleware
app.use(cors({
    origin: ['https://figma-oauth-plugin-production.up.railway.app', 'https://www.figma.com'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
},
    (accessToken, refreshToken, profile, done) => {
        // In production, you might want to save this to a database
        const user = {
            id: profile.id,
            displayName: profile.displayName,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            picture: profile.photos?.[0]?.value,
            accessToken
        };
        return done(null, user);
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Routes

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Figma OAuth Backend Server',
        timestamp: new Date().toISOString()
    });
});

// Initiate Google OAuth flow
app.get('/auth/google', (req, res, next) => {
    const sessionId = req.query.session;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
    }

    // Store session ID in the session
    req.session.pluginSessionId = sessionId;

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: sessionId
    })(req, res, next);
});

// Google OAuth callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/failure' }),
    (req, res) => {
        const sessionId = req.session.pluginSessionId || req.query.state;

        if (!sessionId) {
            return res.redirect('/auth/failure');
        }

        // Generate a simple token (in production, use JWT or similar)
        const token = generateToken();

        // Store session data
        sessions.set(sessionId, {
            authenticated: true,
            token,
            userInfo: {
                id: req.user.id,
                displayName: req.user.displayName,
                name: req.user.name,
                email: req.user.email,
                picture: req.user.picture
            },
            timestamp: Date.now()
        });

        // Show success page
        res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 400px;
          }
          h1 {
            color: #667eea;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
          }
          .checkmark {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
          }
          .checkmark circle {
            stroke: #4caf50;
            stroke-width: 3;
            fill: none;
          }
          .checkmark path {
            stroke: #4caf50;
            stroke-width: 3;
            fill: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <svg class="checkmark" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="25"/>
            <path d="M14 27l7 7 16-16"/>
          </svg>
          <h1>Authentication Successful!</h1>
          <p>You have been successfully authenticated.</p>
          <p><strong>You can now close this window and return to Figma.</strong></p>
        </div>
      </body>
      </html>
    `);
    }
);

// Authentication failure page
app.get('/auth/failure', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Failed</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 400px;
        }
        h1 {
          color: #f44336;
          margin-bottom: 20px;
        }
        p {
          color: #666;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Authentication Failed</h1>
        <p>There was an error during authentication.</p>
        <p>Please close this window and try again.</p>
      </div>
    </body>
    </html>
  `);
});

// Session status endpoint (for polling)
app.get('/session-status', (req, res) => {
    const sessionId = req.query.session;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
    }

    const sessionData = sessions.get(sessionId);

    if (!sessionData) {
        return res.json({ authenticated: false });
    }

    // Check if session is expired (24 hours)
    const isExpired = Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000;

    if (isExpired) {
        sessions.delete(sessionId);
        return res.json({
            authenticated: false,
            error: 'Session expired'
        });
    }

    // Return session data
    res.json({
        authenticated: sessionData.authenticated,
        token: sessionData.token,
        userInfo: sessionData.userInfo
    });

    // Clean up session after successful retrieval
    // sessions.delete(sessionId); // Uncomment if you want one-time use
});

// Logout endpoint
app.post('/logout', (req, res) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        // Find and delete session by token
        for (const [sessionId, data] of sessions.entries()) {
            if (data.token === token) {
                sessions.delete(sessionId);
                break;
            }
        }
    }

    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

// Clean up expired sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, data] of sessions.entries()) {
        if (now - data.timestamp > 24 * 60 * 60 * 1000) {
            sessions.delete(sessionId);
        }
    }
}, 60 * 60 * 1000); // Every hour

// Utility function to generate token
function generateToken() {
    return Math.random().toString(36).substring(2) +
        Date.now().toString(36) +
        Math.random().toString(36).substring(2);
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Google OAuth configured: ${!!process.env.GOOGLE_CLIENT_ID}`);
});
