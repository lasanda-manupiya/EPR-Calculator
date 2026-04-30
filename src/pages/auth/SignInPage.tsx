import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function SignInPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      nav('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-6"><form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4"><h1 className="text-2xl font-bold">Sign in</h1><p className="text-sm text-slate-500">Sign in with your Supabase email/password account.</p>{error && <p className="text-red-600 text-sm">{error}</p>}<input required type="email" className="w-full border rounded-lg p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><input required type="password" className="w-full border rounded-lg p-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} /><button disabled={submitting} className="w-full bg-emerald-600 text-white rounded-lg py-2 font-medium disabled:opacity-60">{submitting ? 'Signing in...' : 'Sign in'}</button><p className="text-sm">No account? <Link to="/register" className="text-emerald-700">Register here</Link></p></form></div>;
}
