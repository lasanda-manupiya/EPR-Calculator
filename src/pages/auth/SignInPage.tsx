import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function SignInPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    try { signIn(email, password); nav('/'); } catch (err) { setError((err as Error).message); }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-6"><form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4"><h1 className="text-2xl font-bold">SustainZone EPR Login</h1><p className="text-sm text-slate-500">Use super admin: superadmin@sustainzone.com / SuperAdmin@123</p>{error && <p className="text-red-600 text-sm">{error}</p>}<input required className="w-full border rounded-lg p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><input required type="password" className="w-full border rounded-lg p-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} /><button className="w-full bg-emerald-600 text-white rounded-lg py-2 font-medium">Sign in</button><Link to="/forgot-password" className="text-sm text-emerald-700">Forgot password?</Link></form></div>;
}
