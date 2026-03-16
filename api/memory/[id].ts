import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '../_auth.js';

const sql = neon(process.env.NEON_DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Memory id is required' });
    return;
  }

  const userId = await requireAuth(req, res);
  if (!userId) return;

  // GET /api/memory/:id
  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT
          m.*,
          json_agg(g.*) FILTER (WHERE g.id IS NOT NULL) AS gifts
        FROM memories m
        LEFT JOIN gifts g ON g.memory_id = m.id
        WHERE m.id = ${id} AND m.user_id = ${userId}
        GROUP BY m.id
      `;
      if (rows.length === 0) {
        res.status(404).json({ error: 'Memory not found' });
        return;
      }
      res.status(200).json(rowToMemory(rows[0]));
    } catch (err) {
      console.error(`GET /api/memory/${id} error:`, err);
      res.status(500).json({ error: 'Failed to fetch memory' });
    }
    return;
  }

  // PATCH /api/memory/:id
  if (req.method === 'PATCH') {
    try {
      const { generatedScript, videoUrl, photoUrl, status } = req.body;
      await sql`
        UPDATE memories
        SET
          generated_script = COALESCE(${generatedScript ?? null}, generated_script),
          video_url        = COALESCE(${videoUrl        ?? null}, video_url),
          photo_url        = COALESCE(${photoUrl        ?? null}, photo_url),
          status           = COALESCE(${status          ?? null}, status),
          updated_at       = NOW()
        WHERE id = ${id} AND user_id = ${userId}
      `;
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(`PATCH /api/memory/${id} error:`, err);
      res.status(500).json({ error: 'Failed to update memory' });
    }
    return;
  }

  // DELETE /api/memory/:id
  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM memories WHERE id = ${id} AND user_id = ${userId}`;
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(`DELETE /api/memory/${id} error:`, err);
      res.status(500).json({ error: 'Failed to delete memory' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function rowToMemory(row: Record<string, unknown>) {
  const giftsRaw = row.gifts as Array<Record<string, unknown>> | null;
  return {
    id:              row.id,
    userId:          row.user_id,
    photoUrl:        row.photo_url,
    location:        row.location,
    dateTaken:       row.date_taken,
    description:     row.description,
    generatedScript: row.generated_script,
    videoUrl:        row.video_url,
    status:          row.status,
    gift:            giftsRaw && giftsRaw.length > 0 ? rowToGift(giftsRaw[0]) : undefined,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
  };
}

function rowToGift(row: Record<string, unknown>) {
  return {
    id:         row.id,
    memoryId:   row.memory_id,
    title:      row.title,
    message:    row.message,
    mediaUrl:   row.media_url,
    revealDate: row.reveal_date,
    isLocked:   row.is_locked,
    createdAt:  row.created_at,
  };
}
