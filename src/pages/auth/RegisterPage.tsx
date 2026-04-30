import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const { needsEmailConfirmation } = await signUp(email, password, { name, companyName });
      setMessage(needsEmailConfirmation ? 'Account created. Please confirm your email before signing in.' : 'Account created. You can sign in now.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6"><form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-8 space-y-4"><h1 className="text-xl font-semibold">Register</h1>{message && <p className="text-emerald-700 text-sm">{message}</p>}{error && <p className="text-red-600 text-sm">{error}</p>}<input className="w-full border rounded-lg p-2" placeholder="Name (optional)" value={name} onChange={e=>setName(e.target.value)} /><input className="w-full border rounded-lg p-2" placeholder="Company (optional)" value={companyName} onChange={e=>setCompanyName(e.target.value)} /><input required type="email" className="w-full border rounded-lg p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><input required type="password" className="w-full border rounded-lg p-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} /><input required type="password" className="w-full border rounded-lg p-2" placeholder="Confirm password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /><button className="w-full bg-slate-900 text-white rounded-lg py-2">Create account</button><Link className="text-sm text-slate-700" to="/sign-in">Back to sign in</Link></form></div>;
}
