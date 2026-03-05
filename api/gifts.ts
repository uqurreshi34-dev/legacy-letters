import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {

  // POST /api/gifts
  if (req.method === 'POST') {
    try {
      const { memoryId, title, message, mediaUrl, revealDate, isLocked } = req.body;

      const rows = await sql`
        INSERT INTO gifts (memory_id, title, message, media_url, reveal_date, is_locked)
        VALUES (
          ${memoryId},
          ${title},
          ${message},
          ${mediaUrl    ?? null},
          ${revealDate  ?? null},
          ${isLocked    ?? false}
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
