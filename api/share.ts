import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './_auth.js';
import { randomBytes } from 'crypto';

const sql = neon(process.env.NEON_DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {

  if (req.method === 'POST') {
    const userId = await requireAuth(req, res);
    if (!userId) return;

    try {
      await sql`DELETE FROM share_tokens WHERE user_id = ${userId}`;

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
