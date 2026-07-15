import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type Mode = 'create' | 'join';

const passwordProblem = (pw: string): string | null => {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must contain both letters and numbers.';
  return null;
};

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('create');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [invitePreview, setInvitePreview] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const checkInvite = async () => {
    setInvitePreview('');
    if (!supabase || !inviteCode.trim()) return;
    const { data } = await supabase.rpc('preview_invite_code', { p_code: inviteCode.trim() });
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.valid) setInvitePreview(`✓ Valid — joins "${row.company_name}" as ${row.member_role}.`);
    else setInvitePreview('✗ This invite code is invalid or expired.');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!consent) return setError('You must accept the Privacy Policy to register.');
    const pwProblem = passwordProblem(password);
    if (pwProblem) return setError(pwProblem);
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (mode === 'create' && !companyName.trim()) return setError('Company name is required.');
    if (mode === 'join' && !inviteCode.trim()) return setError('Invite code is required.');

    setSubmitting(true);
    try {
      // Pre-check duplicate company name for a clearer message.
      if (mode === 'create' && supabase) {
        const { data: available } = await supabase.rpc('company_name_available', { p_name: companyName.trim() });
        if (available === false) {
          setSubmitting(false);
          return setError('That company name is already taken. If it is your company, ask an admin for an invite code.');
        }
      }
      const { needsEmailConfirmation } = await signUp(email.trim(), password, {
        fullName: fullName.trim(),
        companyName: mode === 'create' ? companyName.trim() : undefined,
        inviteCode: mode === 'join' ? inviteCode.trim() : undefined,
        gdprConsent: consent,
      });
      setMessage(
        needsEmailConfirmation
          ? 'Account created. Check your inbox and confirm your email before signing in.'
          : 'Account created. You can sign in now.',
      );
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-8 space-y-4">
        <h1 className="text-xl font-semibold">Create your account</h1>

        <div className="flex rounded-lg border overflow-hidden text-sm">
          <button type="button" onClick={() => setMode('create')} className={`flex-1 py-2 ${mode === 'create' ? 'bg-emerald-600 text-white' : 'bg-white'}`}>Start a company</button>
          <button type="button" onClick={() => setMode('join')} className={`flex-1 py-2 ${mode === 'join' ? 'bg-emerald-600 text-white' : 'bg-white'}`}>Join with a code</button>
        </div>
        <p className="text-xs text-slate-500">
          {mode === 'create'
            ? 'You will become the admin of a new company. Invite teammates later with a code.'
            : 'Ask your company admin for an invite code to join their workspace.'}
        </p>

        {message && <p className="text-emerald-700 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input className="w-full border rounded-lg p-2" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />

        {mode === 'create' ? (
          <input required className="w-full border rounded-lg p-2" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        ) : (
          <div>
            <input required className="w-full border rounded-lg p-2" placeholder="Invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} onBlur={checkInvite} />
            {invitePreview && <p className={`text-xs mt-1 ${invitePreview.startsWith('✓') ? 'text-emerald-700' : 'text-red-600'}`}>{invitePreview}</p>}
          </div>
        )}

        <input required type="email" className="w-full border rounded-lg p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input required type="password" className="w-full border rounded-lg p-2" placeholder="Password (min 8, letters + numbers)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input required type="password" className="w-full border rounded-lg p-2" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I agree to the processing of my data as described in the{' '}
            <Link to="/privacy" className="text-emerald-700 underline" target="_blank">Privacy Policy</Link>. (GDPR)
          </span>
        </label>

        <button disabled={submitting} className="w-full bg-slate-900 text-white rounded-lg py-2 disabled:opacity-60">{submitting ? 'Creating...' : 'Create account'}</button>
        <Link className="text-sm text-slate-700 block" to="/sign-in">Back to sign in</Link>
      </form>
    </div>
  );
}
