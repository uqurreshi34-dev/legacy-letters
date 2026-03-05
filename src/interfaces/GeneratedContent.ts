export interface GeneratedScript {
    memoryId: string;
    script: string;
    generatedAt: string;
  }
  
  export interface GeneratedVideo {
    memoryId: string;
    videoUrl: string;
    thumbnailUrl?: string;
    durationSeconds: number;
    generatedAt: string;
  }
  
  export interface VideoGenerationTask {
    taskId: string;
    status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    videoUrl?: string;
    error?: string;
  }
  
  export interface ClaudeApiResponse {
    content: Array<{ type: string; text: string }>;
    model: string;
    usage: { input_tokens: number; output_tokens: number };
  }
