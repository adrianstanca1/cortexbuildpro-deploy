import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCorsPreflight, setCorsHeaders } from '../../cors';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

if (!GITHUB_CLIENT_ID) {
  console.error('GITHUB_CLIENT_ID environment variable is required');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return;
  }

  // Set CORS headers for allowed origins
  setCorsHeaders(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    return res.status(200).json({
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
}