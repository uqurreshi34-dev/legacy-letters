export interface Gift {
    id: string;
    memoryId: string;
    title: string;
    message: string;
    mediaUrl?: string;
    revealDate?: string;
    isLocked: boolean;
    createdAt: string;
  }
  
  export interface CreateGiftInput {
    memoryId: string;
    title: string;
    message: string;
    mediaUrl?: string;
    revealDate?: string;
    isLocked?: boolean;
  }
