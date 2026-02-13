// Main plugin code running in Figma's sandbox
// This handles authentication state, polling, and token storage

const BACKEND_URL = 'https://figma-oauth-plugin-production.up.railway.app'; // Change to your production URL
const POLLING_INTERVAL = 3000; // 3 seconds
const MAX_POLLING_TIME = 300000; // 5 minutes

let pollingInterval = null;
let pollingStartTime = null;

// Show the plugin UI
figma.showUI(__html__, { width: 400, height: 500 });

// Check if user is already authenticated
(async () => {
  const token = await figma.clientStorage.getAsync('authToken');
  const userInfo = await figma.clientStorage.getAsync('userInfo');
  
  if (token && userInfo) {
    figma.ui.postMessage({ 
      type: 'authStateChanged', 
      authenticated: true,
      userInfo: JSON.parse(userInfo)
    });
  }
})();

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'startPolling') {
    startPolling(msg.sessionId);
  }
  
  if (msg.type === 'logout') {
    await handleLogout();
  }
  
  if (msg.type === 'checkAuth') {
    const token = await figma.clientStorage.getAsync('authToken');
    const userInfo = await figma.clientStorage.getAsync('userInfo');
    
    figma.ui.postMessage({ 
      type: 'authStateChanged', 
      authenticated: !!token,
      userInfo: userInfo ? JSON.parse(userInfo) : null
    });
  }
};

async function startPolling(sessionId) {
  // Clear any existing polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  pollingStartTime = Date.now();
  
  pollingInterval = setInterval(async () => {
    try {
      // Check if polling has exceeded max time
      if (Date.now() - pollingStartTime > MAX_POLLING_TIME) {
        clearInterval(pollingInterval);
        figma.ui.postMessage({ 
          type: 'loginError', 
          error: 'Authentication timeout. Please try again.' 
        });
        return;
      }
      
      // Poll the backend for session status
      const response = await fetch(`${BACKEND_URL}/session-status?session=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check session status');
      }
      
      const data = await response.json();
      
      if (data.authenticated) {
        // Stop polling
        clearInterval(pollingInterval);
        
        // Store the token and user info
        await figma.clientStorage.setAsync('authToken', data.token);
        await figma.clientStorage.setAsync('userInfo', JSON.stringify(data.userInfo));
        
        // Notify UI of successful login
        figma.ui.postMessage({ 
          type: 'loginSuccess',
          userInfo: data.userInfo
        });
      } else if (data.error) {
        // Stop polling on error
        clearInterval(pollingInterval);
        figma.ui.postMessage({ 
          type: 'loginError', 
          error: data.error 
        });
      }
    } catch (error) {
      clearInterval(pollingInterval);
      figma.ui.postMessage({ 
        type: 'loginError', 
        error: 'Network error. Please check your connection and try again.' 
      });
    }
  }, POLLING_INTERVAL);
}

async function handleLogout() {
  try {
    const token = await figma.clientStorage.getAsync('authToken');
    
    // Call backend logout endpoint
    if (token) {
      await fetch(`${BACKEND_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
    
    // Clear local storage
    await figma.clientStorage.deleteAsync('authToken');
    await figma.clientStorage.deleteAsync('userInfo');
    
    // Clear any active polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Notify UI
    figma.ui.postMessage({ 
      type: 'authStateChanged', 
      authenticated: false 
    });
  } catch (error) {
    figma.ui.postMessage({ 
      type: 'logoutError', 
      error: 'Failed to logout. Please try again.' 
    });
  }
}
