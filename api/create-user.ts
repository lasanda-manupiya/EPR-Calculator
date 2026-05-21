import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type AllowedRole = 'admin' | 'supplier';

interface CreateUserBody {
  email?: string;
  full_name?: string;
  role?: AllowedRole;
  company_id?: string;
  temporary_password?: string;
}

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getBearerToken(header?: string) {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!url || !anonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase server configuration is missing.' });
  }

  const token = getBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Missing or invalid Authorization header.' });

  const body = (req.body ?? {}) as CreateUserBody;
  const email = body.email?.trim().toLowerCase() ?? '';
  const fullName = body.full_name?.trim() ?? '';
  const targetRole = body.role;
  const companyId = body.company_id?.trim() ?? '';
  const temporaryPassword = body.temporary_password ?? '';

  if (!emailPattern.test(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (fullName.length < 2) return res.status(400).json({ error: 'Full name is required.' });
  if (targetRole !== 'admin' && targetRole !== 'supplier') return res.status(400).json({ error: 'Role must be admin or supplier.' });
  if (!companyId) return res.status(400).json({ error: 'Company is required.' });
  if (temporaryPassword.length < 8) return res.status(400).json({ error: 'Temporary password must be at least 8 characters long.' });

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const serviceClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerError } = await authClient.auth.getUser();
  if (callerError || !callerData.user) {
    return res.status(401).json({ error: 'Invalid session.' });
  }

  const callerId = callerData.user.id;

  const { data: callerMemberships, error: membershipError } = await serviceClient
    .from('company_admins')
    .select('company_id, role')
    .eq('user_id', callerId);

  if (membershipError) return res.status(500).json({ error: `Failed to validate caller role: ${membershipError.message}` });

  const memberships = callerMemberships ?? [];
  const isSuperadmin = memberships.some((row) => row.role === 'superadmin');
  const isAdminForTargetCompany = memberships.some((row) => row.role === 'admin' && row.company_id === companyId);
  const isSupplier = memberships.some((row) => row.role === 'supplier');

  if (isSupplier && !isSuperadmin && !isAdminForTargetCompany) {
    return res.status(403).json({ error: 'Suppliers are not allowed to create users.' });
  }

  if (targetRole === 'admin' && !isSuperadmin) {
    return res.status(403).json({ error: 'Only superadmin can create admin users.' });
  }

  if (targetRole === 'supplier' && !(isSuperadmin || isAdminForTargetCompany)) {
    return res.status(403).json({ error: 'Admins can only create supplier users for their own company.' });
  }

  const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: targetRole,
      company_id: companyId,
      force_password_change: true,
    },
  });

  if (createError || !createdUser.user) {
    return res.status(400).json({ error: createError?.message ?? 'Failed to create user.' });
  }

  const { error: upsertError } = await serviceClient.from('company_admins').upsert({
    company_id: companyId,
    user_id: createdUser.user.id,
    full_name: fullName,
    role: targetRole,
  }, { onConflict: 'company_id,user_id' });

  if (upsertError) return res.status(500).json({ error: `User created but company mapping failed: ${upsertError.message}` });

  return res.status(200).json({
    message: 'User created successfully. They can now log in with the temporary password.',
    user_id: createdUser.user.id,
  });
}
