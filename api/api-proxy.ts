import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
const EXTERNAL_API_BASE_URL = 'https://generativelanguage.googleapis.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Goog-Api-Key');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }

  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    let targetPath = url.pathname.replace('/api/api-proxy', '');
    if (targetPath.startsWith('/')) targetPath = targetPath.substring(1);
    
    if (!targetPath && req.query.path) {
        targetPath = req.query.path as string;
    }

    if (!targetPath) {
        return res.status(400).json({ error: 'No target path specified' });
    }

    const apiUrl = `${EXTERNAL_API_BASE_URL}/${targetPath}${url.search}`;

    const outgoingHeaders: Record<string, string> = {};
    for (const header in req.headers) {
      if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(header.toLowerCase())) {
        outgoingHeaders[header] = req.headers[header] as string;
      }
    }

    outgoingHeaders['X-Goog-Api-Key'] = GEMINI_API_KEY;

    const fetchOptions: any = {
      method: req.method,
      headers: outgoingHeaders,
    };

    if (!['GET', 'HEAD'].includes(req.method || '')) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const apiResponse = await fetch(apiUrl, fetchOptions);

    // Forward headers
    apiResponse.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    const data = await apiResponse.buffer();
    return res.status(apiResponse.status).send(data);
  } catch (error: any) {
    console.error('Proxy Error:', error.message);
    return res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
