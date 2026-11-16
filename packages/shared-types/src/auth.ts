// Auth types wrapping Clerk's user/org context

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  displayName?: string;
  logoUrl?: string;
  role: string;
  createdAt?: Date;
}

export interface AuthOrganization {
  id: string;
  name: string;
  logoUrl?: string;
  role: string; // Member's role in the org
}

export interface AuthContext {
  user: AuthUser;
  organization?: AuthOrganization;
}
