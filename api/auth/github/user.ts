import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCorsPreflight, setCorsHeaders } from '../../cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return;
  }

  // Set CORS headers for allowed origins
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
    return res.status(200).json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
}