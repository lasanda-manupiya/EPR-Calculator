import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo, LeafMark } from '@/components/BrandLogo';
import { REMEMBER_KEY } from '@/lib/supabase';

export default function SignInPage() {
  const { signIn, resendVerification } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [needsVerify, setNeedsVerify] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setNeedsVerify(false);
    setSubmitting(true);
    try {
      // Route session storage before authenticating.
      try { window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0'); } catch { /* ignore */ }
      await signIn(email, password);
      nav('/');
    } catch (err) {
      const msg = (err as Error).message;
      if (/confirm|verif/i.test(msg)) {
        setNeedsVerify(true);
        setError('Please confirm your email before signing in.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError('');
    setNotice('');
    try {
      await resendVerification(email);
      setNotice('Verification email sent. Check your inbox.');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4">
        <div className="flex justify-center mb-2">
          <BrandLogo
            src="/epr-calculator-logo.png"
            alt="EPR Calculator by SustainZone"
            className="w-56 h-auto"
            fallback={<div className="flex items-center gap-2"><LeafMark className="h-10 w-10" /><span className="text-lg font-bold text-slate-800">EPR Calculator</span></div>}
          />
        </div>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-slate-500">Sign in to your SustainZone EPR account.</p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {notice && <p className="text-emerald-700 text-sm">{notice}</p>}
        {needsVerify && (
          <button type="button" onClick={resend} className="text-sm text-emerald-700 underline">Resend verification email</button>
        )}
        <input required type="email" className="w-full border rounded-lg p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input required type="password" className="w-full border rounded-lg p-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Keep me signed in for 30 days
        </label>
        <button disabled={submitting} className="w-full bg-emerald-600 text-white rounded-lg py-2 font-medium disabled:opacity-60">{submitting ? 'Signing in...' : 'Sign in'}</button>
        <p className="text-sm">No account? <Link to="/register" className="text-emerald-700">Register here</Link></p>
        <p className="text-xs text-slate-400"><Link to="/privacy" className="underline">Privacy Policy</Link></p>
      </form>
    </div>
  );
}
