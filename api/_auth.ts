/**
 * _auth.ts
 * Verifies the Clerk JWT token from the Authorization header.
 * Uses verifyToken from @clerk/backend which works reliably in serverless.
 */

import { verifyToken } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<string | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    res.status(401).json({ error: 'Unauthorised — no token provided' });
    return null;
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    if (!payload?.sub) {
      res.status(401).json({ error: 'Unauthorised — invalid token' });
      return null;
    }

    return payload.sub;
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'Unauthorised — invalid token' });
    return null;
  }
}
