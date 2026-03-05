/**
 * memoryService.ts
 * All data operations go through the /api endpoints.
 * The browser never touches Neon directly.
 */

import { Memory, CreateMemoryInput } from '@interfaces/Memory';
import { Gift, CreateGiftInput } from '@interfaces/Gift';
import { UserProfile, CreateProfileInput } from '@interfaces/UserProfile';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

// ─── User Profile ──────────────────────────────────────────────────────────────

export async function getOrCreateProfile(
  input: CreateProfileInput
): Promise<UserProfile> {
  // Try to fetch existing profile first
  try {
    return await apiFetch<UserProfile>('/api/profile');
  } catch {
    // None exists — create one
    return await apiFetch<UserProfile>('/api/profile', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}

export async function updateProfile(
  _id: string,
  input: Partial<CreateProfileInput>
): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/profile', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Memories ─────────────────────────────────────────────────────────────────

export async function getAllMemories(profileId: string): Promise<Memory[]> {
  return apiFetch<Memory[]>(`/api/memories?profileId=${profileId}`);
}

export async function getMemoryById(id: string): Promise<Memory | null> {
  try {
    return await apiFetch<Memory>(`/api/memory/${id}`);
  } catch {
    return null;
  }
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  return apiFetch<Memory>('/api/memories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMemoryScript(
  id: string,
  script: string
): Promise<void> {
  await apiFetch(`/api/memory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ generatedScript: script, status: 'ready' }),
  });
}

export async function updateMemoryVideo(
  id: string,
  videoUrl: string
): Promise<void> {
  await apiFetch(`/api/memory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ videoUrl }),
  });
}

export async function setMemoryStatus(
  id: string,
  status: Memory['status']
): Promise<void> {
  await apiFetch(`/api/memory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ─── Gifts ────────────────────────────────────────────────────────────────────

export async function createGift(input: CreateGiftInput): Promise<Gift> {
  return apiFetch<Gift>('/api/gifts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
