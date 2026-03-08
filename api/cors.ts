import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Allowed origins for CORS requests
 */
const ALLOWED_ORIGINS = [
  'https://buildprodeploy.vercel.app',
  'https://cortexbuildpro.com',
  'http://localhost:5173',
  'http://localhost:3000',
] as const;

/**
 * Get the allowed origin from the request's Origin header
 * Returns the origin if it's in the allowlist, otherwise returns null
 */
export function getAllowedOrigin(req: VercelRequest): string | null {
  const origin = req.headers.origin;

  if (!origin) {
    // If no origin header (e.g., same-origin requests, mobile apps, or curl),
    // allow the request but don't set Access-Control-Allow-Origin
    return null;
  }

  if (ALLOWED_ORIGINS.includes(origin as typeof ALLOWED_ORIGINS[number])) {
    return origin;
  }

  return null;
}

/**
 * Set CORS headers for allowed origins only
 * Returns true if the origin is allowed, false otherwise
 */
export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigin = getAllowedOrigin(req);

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return true;
  }

  // Origin not allowed - don't set CORS headers
  return false;
}

/**
 * Handle CORS preflight requests
 * Returns true if this was a preflight request that was handled
 */
export function handleCorsPreflight(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    const allowedOrigin = getAllowedOrigin(req);

    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    }

    res.status(200).end();
    return true;
  }

  return false;
}