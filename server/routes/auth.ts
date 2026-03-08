/**
 * GitHub OAuth Backend Routes
 * Server-side routes for secure token exchange
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// GitHub App Configuration - use environment variables in production
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Iv23liOpQ1FlTeVrW2di';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

/**
 * Exchange authorization code for access token
 * POST /api/auth/github/token
 */
router.post('/github/token', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for token with GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await tokenResponse.json();

    if (data.error) {
      console.error('GitHub token error:', data.error);
      return res.status(400).json({ error: data.error_description || data.error });
    }

    // Return the access token to the client
    res.json({
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

/**
 * Get current authenticated user's GitHub profile
 * GET /api/auth/github/user
 */
router.get('/github/user', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      return res.status(userResponse.status).json({ error: 'Failed to fetch user' });
    }

    const user = await userResponse.json();
    res.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

/**
 * OAuth callback endpoint
 * GET /auth/callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'github_oauth_callback', error: 'No authorization code received' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  // Exchange code for token
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code as string,
      }),
    });

    const data = await tokenResponse.json();

    if (data.error) {
      return res.status(400).send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'github_oauth_callback', error: '${data.error_description || data.error}' }, '*');
              window.close();
            </script>
          </body>
        </html>
      `);
    }

    // Return token to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'github_oauth_callback', code: '${code}', token: '${data.access_token}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'github_oauth_callback', error: 'Failed to complete authentication' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }
});

/**
 * Google OAuth Configuration
 */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

/**
 * Exchange authorization code for Google access token
 * POST /api/auth/google/token
 */
router.post('/google/token', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for token with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'postmessage', // For popup flow
      }).toString(),
    });

    const data = await tokenResponse.json();
    if (data.error) {
      console.error('Google token error:', data.error);
      return res.status(400).json({ error: data.error_description || data.error });
    }

    // Return the access token to the client
    res.json({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
    });
  } catch (error) {
    console.error('Google token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

/**
 * Get current authenticated user's Google profile
 * GET /api/auth/google/user
 */
router.get('/google/user', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      return res.status(userResponse.status).json({ error: 'Failed to fetch user' });
    }

    const user = await userResponse.json();
    res.json(user);
  } catch (error) {
    console.error('Google user fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

/**
 * Logout endpoint
 * POST /api/auth/github/logout
 */
router.post('/github/logout', async (_req: Request, res: Response) => {
  // In a production app, you might want to revoke the token with GitHub
  // For now, we just return success - the client will clear local storage
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * Google Logout endpoint
 * POST /api/auth/google/logout
 */
router.post('/google/logout', async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;