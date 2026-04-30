import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '@/utils/authStorage';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try { resetPassword(email, password); setMessage('Password updated. You can sign in now.'); }
    catch (err) { setError((err as Error).message); }
  };
  return <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6"><form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-8 space-y-4"><h1 className="text-xl font-semibold">Reset password</h1>{message && <p className="text-emerald-700 text-sm">{message}</p>}{error && <p className="text-red-600 text-sm">{error}</p>}<input required className="w-full border rounded-lg p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><input required className="w-full border rounded-lg p-2" type="password" placeholder="New password" value={password} onChange={e=>setPassword(e.target.value)} /><button className="w-full bg-slate-900 text-white rounded-lg py-2">Update password</button><Link className="text-sm text-slate-700" to="/sign-in">Back to sign in</Link></form></div>;
}
