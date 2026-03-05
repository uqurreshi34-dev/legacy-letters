import { Gift } from '@interfaces/Gift';

export type MemoryStatus = 'pending' | 'processing' | 'ready';

export interface Memory {
  id: string;
  profileId: string;
  photoUrl: string;
  location: string;
  dateTaken: string;
  description?: string;
  generatedScript?: string;
  videoUrl?: string;
  status: MemoryStatus;
  gift?: Gift;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  profileId: string;
  photoUrl: string;
  location: string;
  dateTaken: string;
  description?: string;
}
