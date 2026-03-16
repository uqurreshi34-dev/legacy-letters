import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './_auth.js';

const sql = neon(process.env.NEON_DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {

  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (req.method === 'POST') {
    try {
      const { memoryId, title, message, mediaUrl, revealDate, isLocked } = req.body;

      // Verify the memory belongs to this user before adding a gift
      const ownership = await sql`
        SELECT id FROM memories WHERE id = ${memoryId} AND user_id = ${userId}
      `;
      if (ownership.length === 0) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const rows = await sql`
        INSERT INTO gifts (memory_id, user_id, title, message, media_url, reveal_date, is_locked)
        VALUES (
          ${memoryId}, ${userId}, ${title}, ${message},
          ${mediaUrl ?? null}, ${revealDate ?? null}, ${isLocked ?? false}
        )
        RETURNING *
      `;
      const row = rows[0];
      res.status(201).json({
        id:         row.id,
        memoryId:   row.memory_id,
        title:      row.title,
        message:    row.message,
        mediaUrl:   row.media_url,
        revealDate: row.reveal_date,
        isLocked:   row.is_locked,
        createdAt:  row.created_at,
      });
    } catch (err) {
      console.error('POST /api/gifts error:', err);
      res.status(500).json({ error: 'Failed to create gift' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
