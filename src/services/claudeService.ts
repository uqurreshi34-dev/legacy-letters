/**
 * claudeService.ts
 * Generates personalised video letter scripts from memory data.
 * Calls the Anthropic /v1/messages API directly.
 */

import { Memory } from '@interfaces/Memory';
import { UserProfile } from '@interfaces/UserProfile';
import { GeneratedScript, ClaudeApiResponse } from '@interfaces/GeneratedContent';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

function buildPrompt(memory: Memory, profile: UserProfile): string {
  return `You are ${profile.yourName}, speaking directly to your children (${profile.childrenNames}) in a heartfelt video message recorded during your lifetime.

You are looking at a photo of yourself at: ${memory.location}
When this was taken: ${memory.dateTaken}
What was happening: ${memory.description ?? 'a personal moment from your life'}

Write a warm, intimate 60-second video narration script (around 150 words) where you:
1. Describe exactly what you were doing and feeling in this moment
2. Explain why this place and time matters deeply to you
3. Address your children by name — tell them what you want them to carry forward from this memory
4. End with something specific and unmistakably yours — a piece of wisdom, an inside reference only they'd know, or a direct expression of love

Rules:
- Speak in first person, present tense where possible — as if you're alive and in the room
- Do NOT write as a eulogy or from beyond the grave
- Use "I remember...", "Right now I'm thinking about...", "What I want you to know is..."
- Be specific, not generic — use the location, the time, the context given
- Natural speech rhythm — this will be read aloud on camera

Start the narration immediately. No title, no preamble, no scene direction.`;
}

export async function generateMemoryScript(
  memory: Memory,
  profile: UserProfile
): Promise<GeneratedScript> {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing VITE_ANTHROPIC_API_KEY in .env'
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: buildPrompt(memory, profile),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error ${response.status}: ${error}`);
  }

  const data: ClaudeApiResponse = await response.json();
  const scriptText = data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return {
    memoryId: memory.id,
    script: scriptText,
    generatedAt: new Date().toISOString(),
  };
}
