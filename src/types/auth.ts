export type UserRole = 'super_admin' | 'admin' | 'member';

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyId?: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
}
