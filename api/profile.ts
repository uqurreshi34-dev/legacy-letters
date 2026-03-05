import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT * FROM user_profiles LIMIT 1
      `;
      if (rows.length === 0) {
        res.status(404).json({ error: 'No profile found' });
        return;
      }
      const row = rows[0];
      res.status(200).json({
        id:            row.id,
        yourName:      row.your_name,
        childrenNames: row.children_names,
        photoUrl:      row.photo_url,
        createdAt:     row.created_at,
      });
    } catch (err) {
      console.error('GET /api/profile error:', err);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { yourName, childrenNames, photoUrl } = req.body;

      // Check if one already exists — update it if so
      const existing = await sql`SELECT id FROM user_profiles LIMIT 1`;

      if (existing.length > 0) {
        const updated = await sql`
          UPDATE user_profiles
          SET
            your_name      = COALESCE(${yourName      ?? null}, your_name),
            children_names = COALESCE(${childrenNames ?? null}, children_names),
            photo_url      = COALESCE(${photoUrl      ?? null}, photo_url)
          WHERE id = ${existing[0].id}
          RETURNING *
        `;
        const row = updated[0];
        res.status(200).json({
          id:            row.id,
          yourName:      row.your_name,
          childrenNames: row.children_names,
          photoUrl:      row.photo_url,
          createdAt:     row.created_at,
        });
        return;
      }

      const created = await sql`
        INSERT INTO user_profiles (your_name, children_names, photo_url)
        VALUES (${yourName}, ${childrenNames}, ${photoUrl ?? null})
        RETURNING *
      `;
      const row = created[0];
      res.status(201).json({
        id:            row.id,
        yourName:      row.your_name,
        childrenNames: row.children_names,
        photoUrl:      row.photo_url,
        createdAt:     row.created_at,
      });
    } catch (err) {
      console.error('POST /api/profile error:', err);
      res.status(500).json({ error: 'Failed to save profile' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
