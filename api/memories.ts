import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {

  // GET /api/memories?profileId=xxx
  if (req.method === 'GET') {
    try {
      const { profileId } = req.query;
      if (!profileId) {
        res.status(400).json({ error: 'profileId is required' });
        return;
      }
      const rows = await sql`
        SELECT
          m.*,
          json_agg(g.*) FILTER (WHERE g.id IS NOT NULL) AS gifts
        FROM memories m
        LEFT JOIN gifts g ON g.memory_id = m.id
        WHERE m.profile_id = ${profileId as string}
        GROUP BY m.id
        ORDER BY m.created_at DESC
      `;
      res.status(200).json(rows.map(rowToMemory));
    } catch (err) {
      console.error('GET /api/memories error:', err);
      res.status(500).json({ error: 'Failed to fetch memories' });
    }
    return;
  }

  // POST /api/memories
  if (req.method === 'POST') {
    try {
      const { profileId, photoUrl, location, dateTaken, description } = req.body;
      const rows = await sql`
        INSERT INTO memories (profile_id, photo_url, location, date_taken, description)
        VALUES (${profileId}, ${photoUrl}, ${location}, ${dateTaken}, ${description ?? null})
        RETURNING *
      `;
      res.status(201).json(rowToMemory(rows[0]));
    } catch (err) {
      console.error('POST /api/memories error:', err);
      res.status(500).json({ error: 'Failed to create memory' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function rowToMemory(row: Record<string, unknown>) {
  const giftsRaw = row.gifts as Array<Record<string, unknown>> | null;
  return {
    id:              row.id,
    profileId:       row.profile_id,
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
    id:          row.id,
    memoryId:    row.memory_id,
    title:       row.title,
    message:     row.message,
    mediaUrl:    row.media_url,
    revealDate:  row.reveal_date,
    isLocked:    row.is_locked,
    createdAt:   row.created_at,
  };
}
