import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const { user, resendVerification, signOut } = useAuth();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const resend = async () => {
    setNotice('');
    setError('');
    if (!user?.email) return;
    try {
      await resendVerification(user.email);
      setNotice('Verification email sent. Check your inbox, then reload this page.');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 space-y-4 text-center">
        <h1 className="text-xl font-semibold">Confirm your email</h1>
        <p className="text-sm text-slate-600">
          We sent a confirmation link to <span className="font-medium">{user?.email}</span>. Click it, then reload this page to continue.
        </p>
        {notice && <p className="text-emerald-700 text-sm">{notice}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={resend} className="w-full bg-emerald-600 text-white rounded-lg py-2">Resend confirmation email</button>
        <button onClick={() => window.location.reload()} className="w-full border rounded-lg py-2">I've confirmed, reload</button>
        <button onClick={() => void signOut()} className="text-sm text-slate-500 underline">Sign out</button>
        <p className="text-xs text-slate-400"><Link to="/privacy" className="underline">Privacy Policy</Link></p>
      </div>
    </div>
  );
}
