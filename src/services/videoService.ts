/**
 * videoService.ts
 * Generates video from a still photo using Runway ML Gen-4.
 * Polls the task endpoint until the video is ready.
 */

import { VideoGenerationTask, GeneratedVideo } from '@interfaces/GeneratedContent';

const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1';
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 60; // 4 min timeout

export async function generateVideoFromPhoto(
  memoryId: string,
  imageUrl: string,
  narrationScript: string
): Promise<GeneratedVideo> {
  const apiKey = import.meta.env.VITE_RUNWAY_API_KEY

  if (!apiKey) {
    throw new Error('Missing VITE_RUNWAY_API_KEY in .env');
  }

  // Condense the script into a short visual direction prompt for Runway
  const motionPrompt = buildMotionPrompt(narrationScript);

  // Submit the generation task
  const submitResponse = await fetch(`${RUNWAY_BASE}/image_to_video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model: 'gen4_turbo',
      promptImage: imageUrl,
      promptText: motionPrompt,
      duration: 10,
      ratio: '1280:720',
    }),
  });

  if (!submitResponse.ok) {
    const error = await submitResponse.text();
    throw new Error(`Runway submit error ${submitResponse.status}: ${error}`);
  }

  const task: { id: string } = await submitResponse.json();

  // Poll until done
  const result = await pollForCompletion(task.id, apiKey);

  if (!result.videoUrl) {
    throw new Error('Video generation succeeded but returned no URL');
  }

  return {
    memoryId,
    videoUrl: result.videoUrl,
    durationSeconds: 10,
    generatedAt: new Date().toISOString(),
  };
}

async function pollForCompletion(
  taskId: string,
  apiKey: string
): Promise<VideoGenerationTask> {
  let polls = 0;

  while (polls < MAX_POLLS) {
    await delay(POLL_INTERVAL_MS);
    polls++;

    const response = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) continue;

    const task: VideoGenerationTask = await response.json();

    if (task.status === 'SUCCEEDED') return task;
    if (task.status === 'FAILED') {
      throw new Error(`Runway task failed: ${task.error ?? 'unknown reason'}`);
    }
  }

  throw new Error('Video generation timed out after 4 minutes');
}

/**
 * Converts the narration script into a short Runway motion prompt.
 * Runway works best with short, visual, movement-focused descriptions.
 */
function buildMotionPrompt(script: string): string {
  const firstSentence = script.split('.')[0];
  return (
    `Gentle, slow cinematic camera movement. Warm, golden film grain. ` +
    `The subject is present and alive in this memory. ` +
    `Soft focus pull, natural lighting. ` +
    `Mood: intimate, warm, nostalgic. ` +
    `Context: ${firstSentence.slice(0, 120)}`
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
