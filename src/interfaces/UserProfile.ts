export interface UserProfile {
    id: string;
    yourName: string;
    childrenNames: string;
    photoUrl?: string;
    createdAt: string;
  }
  
  export interface CreateProfileInput {
    yourName: string;
    childrenNames: string;
    photoUrl?: string;
  }
