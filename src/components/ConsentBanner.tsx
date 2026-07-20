import { useState } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'epr_cookie_consent';

/**
 * GDPR cookie/local-storage notice. The app only uses essential browser storage
 * (login/session), so this is informational with a single acknowledgement.
 */
export default function ConsentBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(CONSENT_KEY) === '1';
    } catch {
      return true;
    }
  });

  if (dismissed) return null;

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, '1');
    } catch {
      /* storage unavailable */
    }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 text-slate-100 px-4 py-3 shadow-2xl">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm sm:flex-row sm:items-center">
        <p className="flex-1">
          We store essential login and session data in your browser to keep you signed in and run the app.
          We do not use tracking or advertising cookies. See our{' '}
          <Link to="/privacy" className="text-eco underline">Privacy Policy</Link>.
        </p>
        <button onClick={accept} className="shrink-0 rounded-lg bg-eco px-4 py-2 font-medium text-white">Got it</button>
      </div>
    </div>
  );
}
