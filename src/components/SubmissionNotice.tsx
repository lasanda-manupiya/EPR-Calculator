import { ConfidenceLevel } from '@/types';

/**
 * EPR submissions expect High-confidence packaging figures. When estimates are
 * below that, point the user to SustainZone for verified numbers.
 */
export default function SubmissionNotice({ confidence, count }: { confidence: ConfidenceLevel | null; count: number }) {
  if (!count) return null;
  const ready = confidence === 'High';
  return (
    <div className={`rounded-xl p-4 border ${ready ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
      <p className={`text-sm ${ready ? 'text-emerald-800' : 'text-amber-900'}`}>
        {ready
          ? 'These estimates meet the High confidence level recommended for EPR submission. '
          : 'For EPR submission you need higher-confidence figures — some of these estimates are currently below High confidence. '}
        For verified, submission-ready packaging data, please contact us at{' '}
        <a href="mailto:connect@sustainzone.earth" className="font-semibold underline">connect@sustainzone.earth</a>.
      </p>
    </div>
  );
}
