export interface GeneratedScript {
  memoryId: string;
  script: string;
  generatedAt: string;
}

export interface GeneratedVideo {
  memoryId: string;
  videoUrl: string;
  durationSeconds: number;
  generatedAt: string;
}

export interface HeyGenTaskStatus {
  code: number;
  data: {
    video_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    error?: string;
  };
}

export interface ClaudeApiResponse {
  content: Array<{ type: string; text: string }>;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}
