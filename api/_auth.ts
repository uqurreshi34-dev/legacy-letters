/**
 * _auth.ts
 * Shared Clerk token verification for all API endpoints.
 * Returns the userId or sends a 401 and returns null.
 */

import { createClerkClient } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<string | null> {
  try {
    const requestState = await clerk.authenticateRequest(req as unknown as Request, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const userId = requestState.toAuth()?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorised' });
      return null;
    }

    return userId;
  } catch {
    res.status(401).json({ error: 'Unauthorised — invalid token' });
    return null;
  }
}
