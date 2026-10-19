export type UserAccount = {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
};

export type Organization = {
  id: number;
  name: string;
  slug: string;
  country: string | null;
  role: "owner" | "admin" | "decision_maker" | "reviewer" | "viewer";
  created_at: string;
};

export type OrganizationCreate = {
  name: string;
  country?: string | null;
};
