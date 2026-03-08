import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS configuration - inline to avoid module resolution issues
const ALLOWED_ORIGINS = [
  'https://buildprodeploy.vercel.app',
  'https://cortexbuildpro.com',
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    return res.status(200).json(user);
  } catch (error) {
    console.error('Google user fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
}