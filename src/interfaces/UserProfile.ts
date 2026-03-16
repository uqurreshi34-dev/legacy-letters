// Identity now comes from Clerk.
// yourName and childrenNames are stored in Clerk's publicMetadata.

export interface UserProfile {
  clerkId: string;
  yourName: string;
  childrenNames: string;
  email: string;
}

export interface ProfileMetadata {
  yourName?: string;
  childrenNames?: string;
}
