import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './_auth';
import { randomBytes } from 'crypto';

const sql = neon(process.env.NEON_DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {

  // POST /api/share — generate a new share token
  if (req.method === 'POST') {
    const userId = await requireAuth(req, res);
    if (!userId) return;

    try {
      // Delete any existing token for this user first
      await sql`DELETE FROM share_tokens WHERE user_id = ${userId}`;

      // Generate a new secure random token
      const token = randomBytes(32).toString('hex');

      await sql`
        INSERT INTO share_tokens (token, user_id)
        VALUES (${token}, ${userId})
      `;

      res.status(201).json({ token });
    } catch (err) {
      console.error('POST /api/share error:', err);
      res.status(500).json({ error: 'Failed to generate share token' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
