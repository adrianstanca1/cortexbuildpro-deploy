import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCorsPreflight, setCorsHeaders } from '../../cors';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

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

    // Security: Do NOT send refresh_token to client - keep it server-side only
    return res.status(200).json({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error('Google token exchange error:', error);
    return res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
}