/**
 * videoService.ts
 * Generates a lip-synced video using HeyGen's Talking Photo API.
 * User provides their own HeyGen API key (stored in Clerk metadata).
 * Audio URL comes from Supabase Storage after user uploads/records voice.
 */

import { GeneratedVideo, HeyGenTaskStatus } from '@interfaces/GeneratedContent';

const HEYGEN_BASE = 'https://api.heygen.com';
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 72; // 6 min timeout

export async function generateVideoFromPhoto(
  memoryId: string,
  imageUrl: string,
  audioUrl: string,
  heygenApiKey: string
): Promise<GeneratedVideo> {
  if (!heygenApiKey) {
    throw new Error(
      'No HeyGen API key found. Please add your HeyGen API key in Settings.'
    );
  }

  // Step 1 — submit the talking photo job
  const submitRes = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
    method: 'POST',
    headers: {
      'X-Api-Key': heygenApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: 'talking_photo',
            talking_photo_url: imageUrl,
          },
          voice: {
            type: 'audio',
            audio_url: audioUrl,
          },
        },
      ],
      dimension: { width: 720, height: 1280 },
    }),
  });

  if (!submitRes.ok) {
    const error = await submitRes.text();
    throw new Error(`HeyGen submit error ${submitRes.status}: ${error}`);
  }

  const submitData = await submitRes.json();
  const videoId: string = submitData.data?.video_id;

  if (!videoId) {
    throw new Error('HeyGen did not return a video_id');
  }

  // Step 2 — poll until complete
  const videoUrl = await pollForCompletion(videoId, heygenApiKey);

  return {
    memoryId,
    videoUrl,
    durationSeconds: 0, // HeyGen determines duration from audio length
    generatedAt: new Date().toISOString(),
  };
}

async function pollForCompletion(
  videoId: string,
  apiKey: string
): Promise<string> {
  let polls = 0;

  while (polls < MAX_POLLS) {
    await delay(POLL_INTERVAL_MS);
    polls++;

    const res = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-Api-Key': apiKey },
    });

    if (!res.ok) continue;

    const data: HeyGenTaskStatus = await res.json();

    if (data.data?.status === 'completed' && data.data?.video_url) {
      return data.data.video_url;
    }

    if (data.data?.status === 'failed') {
      throw new Error(`HeyGen video failed: ${data.data?.error ?? 'unknown reason'}`);
    }
  }

  throw new Error('HeyGen video generation timed out after 6 minutes');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
