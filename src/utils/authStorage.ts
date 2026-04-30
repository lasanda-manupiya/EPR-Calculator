import { AuthSession, Company, UserAccount, UserRole } from '@/types/auth';

const USERS_KEY = 'sustainzone_users';
const COMPANIES_KEY = 'sustainzone_companies';
const SESSION_KEY = 'sustainzone_session';

const seed = () => {
  const users = getUsers();
  if (users.length) return;
  const superAdmin: UserAccount = {
    id: crypto.randomUUID(),
    name: 'SustainZone Super Admin',
    email: 'superadmin@sustainzone.com',
    password: 'SuperAdmin@123',
    role: 'super_admin',
    createdAt: new Date().toISOString()
  };
  saveUsers([superAdmin]);
};

export const getUsers = (): UserAccount[] => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
};
export const saveUsers = (users: UserAccount[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

export const getCompanies = (): Company[] => {
  try { return JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]'); } catch { return []; }
};
export const saveCompanies = (companies: Company[]) => localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));

export const getSession = (): AuthSession | null => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};
export const saveSession = (session: AuthSession | null) => session ? localStorage.setItem(SESSION_KEY, JSON.stringify(session)) : localStorage.removeItem(SESSION_KEY);

export const initializeAuth = () => seed();

export const createCompanyWithAdmin = (companyName: string, adminName: string, adminEmail: string, password: string) => {
  const companies = getCompanies();
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === adminEmail.toLowerCase())) throw new Error('Email already exists');
  const company: Company = { id: crypto.randomUUID(), name: companyName.trim(), createdAt: new Date().toISOString() };
  const admin: UserAccount = { id: crypto.randomUUID(), name: adminName.trim(), email: adminEmail.trim(), password, role: 'admin', companyId: company.id, createdAt: new Date().toISOString() };
  saveCompanies([...companies, company]);
  saveUsers([...users, admin]);
};

export const createMember = (creator: UserAccount, name: string, email: string, password: string, role: UserRole = 'member') => {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already exists');
  if (!creator.companyId) throw new Error('No company linked.');
  const member: UserAccount = {
    id: crypto.randomUUID(), name: name.trim(), email: email.trim(), password, role, companyId: creator.companyId, createdAt: new Date().toISOString()
  };
  saveUsers([...users, member]);
};

export const resetPassword = (email: string, nextPassword: string) => {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx < 0) throw new Error('No user found for this email.');
  users[idx] = { ...users[idx], password: nextPassword };
  saveUsers(users);
};
