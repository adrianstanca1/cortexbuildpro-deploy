import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// CORS configuration - inline to avoid module resolution issues
const ALLOWED_ORIGINS = [
  'https://buildprodeploy.vercel.app',
  'https://cortexbuildpro.com',
  'https://www.cortexbuildpro.com',
  'http://localhost:5173',
  'http://localhost:3000',
] as const;

function getAllowedOrigin(req: VercelRequest): string | null {
  const origin = req.headers.origin;
  if (!origin) return null;
  return ALLOWED_ORIGINS.includes(origin as typeof ALLOWED_ORIGINS[number]) ? origin : null;
}

function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigin = getAllowedOrigin(req);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return true;
  }
  return false;
}

function handleCorsPreflight(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    const allowedOrigin = getAllowedOrigin(req);
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    res.status(200).end();
    return true;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCorsPreflight(req, res)) return;
  setCorsHeaders(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

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
        redirect_uri: 'postmessage',
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