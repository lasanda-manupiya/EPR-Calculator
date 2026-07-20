import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8 space-y-4 text-sm text-slate-700">
        <h1 className="text-2xl font-semibold">Privacy Policy &amp; Data Notice</h1>
        <p className="text-slate-500">SustainZone EPR — packaging estimation. Last updated: 15 July 2026.</p>

        <section className="space-y-1">
          <h2 className="font-semibold text-slate-900">Who is the data controller</h2>
          <p>SustainZone is the controller of the personal data processed in this application. For any data request, contact <a className="text-emerald-700 underline" href="mailto:connect@sustainzone.earth">connect@sustainzone.earth</a>.</p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-slate-900">What we collect and why</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data</strong> (name, email, company name) — to create and secure your account and link you to your company. Legal basis: contract.</li>
            <li><strong>Product &amp; packaging data</strong> you enter — to produce EPR estimates. Legal basis: contract / legitimate interest.</li>
            <li><strong>Authentication metadata</strong> (login timestamps, email confirmation) handled by our processor, Supabase. Legal basis: legitimate interest (security).</li>
          </ul>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-slate-900">Who can see your data</h2>
          <p>Product and report data is shared with members of <em>your company</em> only. Packaging-library items you create are private to you. A single SustainZone superadmin may access data across companies for support and administration. We do not sell your data.</p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-slate-900">Processors &amp; storage</h2>
          <p>Data is stored with <strong>Supabase</strong> (database &amp; authentication) and the app is hosted on <strong>Vercel</strong>. Data is transmitted over encrypted connections (HTTPS) and protected at the row level so users can only access data they are authorised to see.</p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-slate-900">Your rights (GDPR)</h2>
          <p>You may access, rectify, export, or erase your personal data. From <strong>Settings → Your data (GDPR)</strong> you can download a copy of your data or delete it. Deleting your data removes your library items and company membership; if you are the last member of your company, the company and its records are deleted. To fully remove your login credentials, contact us at the address above.</p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-slate-900">Retention</h2>
          <p>We keep your data for as long as your account is active. You can request deletion at any time as described above.</p>
        </section>

        <Link to="/sign-in" className="inline-block text-emerald-700 underline">Back to sign in</Link>
      </div>
    </div>
  );
}
