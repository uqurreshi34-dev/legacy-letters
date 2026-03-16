/**
 * memoryService.ts
 * All data operations go through the /api endpoints.
 * Every request carries the Clerk session token for server-side auth.
 */

import { Memory, CreateMemoryInput } from '@interfaces/Memory';
import { Gift, CreateGiftInput } from '@interfaces/Gift';

type GetToken = () => Promise<string | null>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  getToken: GetToken,
  options?: RequestInit
): Promise<T> {
  const token = await getToken();
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

// ─── Memories ─────────────────────────────────────────────────────────────────

export async function getAllMemories(
  getToken: GetToken
): Promise<Memory[]> {
  return apiFetch<Memory[]>('/api/memories', getToken);
}

export async function getMemoryById(
  id: string,
  getToken: GetToken
): Promise<Memory | null> {
  try {
    return await apiFetch<Memory>(`/api/memory/${id}`, getToken);
  } catch {
    return null;
  }
}

export async function createMemory(
  input: CreateMemoryInput,
  getToken: GetToken
): Promise<Memory> {
  return apiFetch<Memory>('/api/memories', getToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMemoryScript(
  id: string,
  script: string,
  getToken: GetToken
): Promise<void> {
  await apiFetch(`/api/memory/${id}`, getToken, {
    method: 'PATCH',
    body: JSON.stringify({ generatedScript: script, status: 'ready' }),
  });
}

export async function updateMemoryVideo(
  id: string,
  videoUrl: string,
  getToken: GetToken
): Promise<void> {
  await apiFetch(`/api/memory/${id}`, getToken, {
    method: 'PATCH',
    body: JSON.stringify({ videoUrl }),
  });
}

export async function updateMemoryPhoto(
  id: string,
  photoUrl: string,
  getToken: GetToken
): Promise<void> {
  await apiFetch(`/api/memory/${id}`, getToken, {
    method: 'PATCH',
    body: JSON.stringify({ photoUrl }),
  });
}

export async function setMemoryStatus(
  id: string,
  status: Memory['status'],
  getToken: GetToken
): Promise<void> {
  await apiFetch(`/api/memory/${id}`, getToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteMemory(
  id: string,
  getToken: GetToken
): Promise<void> {
  await apiFetch(`/api/memory/${id}`, getToken, {
    method: 'DELETE',
  });
}

// ─── Gifts ────────────────────────────────────────────────────────────────────

export async function createGift(
  input: CreateGiftInput,
  getToken: GetToken
): Promise<Gift> {
  return apiFetch<Gift>('/api/gifts', getToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ─── Share tokens ─────────────────────────────────────────────────────────────

export async function generateShareToken(
  getToken: GetToken
): Promise<string> {
  const data = await apiFetch<{ token: string }>('/api/share', getToken, {
    method: 'POST',
  });
  return data.token;
}
