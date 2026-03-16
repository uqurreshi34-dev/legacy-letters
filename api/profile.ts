import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { requireAuth } from './_auth';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {

  const userId = await requireAuth(req, res);
  if (!userId) return;

  // PATCH /api/profile — save yourName and childrenNames to Clerk metadata
  if (req.method === 'PATCH') {
    try {
      const { yourName, childrenNames } = req.body;

      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          yourName:      yourName      ?? undefined,
          childrenNames: childrenNames ?? undefined,
        },
      });

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('PATCH /api/profile error:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
