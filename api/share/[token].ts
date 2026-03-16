import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  if (req.method === 'GET') {
    try {
      // Validate the token
      const tokenRows = await sql`
        SELECT user_id FROM share_tokens
        WHERE token = ${token}
        AND (expires_at IS NULL OR expires_at > NOW())
      `;

      if (tokenRows.length === 0) {
        res.status(404).json({ error: 'Invalid or expired share link' });
        return;
      }

      const userId = tokenRows[0].user_id as string;

      // Return all memories for this user (read-only, no auth needed)
      const rows = await sql`
        SELECT
          m.*,
          json_agg(g.*) FILTER (WHERE g.id IS NOT NULL) AS gifts
        FROM memories m
        LEFT JOIN gifts g ON g.memory_id = m.id
        WHERE m.user_id = ${userId}
        GROUP BY m.id
        ORDER BY m.created_at DESC
      `;

      res.status(200).json({ memories: rows.map(rowToMemory) });
    } catch (err) {
      console.error(`GET /api/share/${token} error:`, err);
      res.status(500).json({ error: 'Failed to load shared vault' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function rowToMemory(row: Record<string, unknown>) {
  const giftsRaw = row.gifts as Array<Record<string, unknown>> | null;
  return {
    id:              row.id,
    photoUrl:        row.photo_url,
    location:        row.location,
    dateTaken:       row.date_taken,
    description:     row.description,
    generatedScript: row.generated_script,
    videoUrl:        row.video_url,
    status:          row.status,
    gift:            giftsRaw && giftsRaw.length > 0 ? rowToGift(giftsRaw[0]) : undefined,
    createdAt:       row.created_at,
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
