import { FileDown, Copy, Braces } from 'lucide-react';
import type { FhirBundle } from '../lib/fhir';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

interface Props {
  bundle: FhirBundle | null;
  counts: { pending: number; approved: number; rejected: number; blocked: number };
  pendingBlocked: number;
}

export function BundleView({ bundle, counts, pendingBlocked }: Props) {
  const json = bundle ? JSON.stringify(bundle, null, 2) : '';

  const download = () => {
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'streamproof-bundle.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats: { n: number; label: string }[] = [
    { n: counts.approved, label: 'approved records - these are in the export' },
    { n: counts.rejected, label: 'rejected by a human reviewer - excluded' },
    { n: counts.pending, label: 'still waiting for review - excluded' },
    ...(pendingBlocked > 0 ? [{ n: pendingBlocked, label: 'of the waiting records are blocked by rule errors and can never be approved as-is' }] : []),
  ];

  return (
    <div className="grid items-start gap-4 min-[1100px]:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle><FileDown size={18} className="text-primary" /> Export summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {stats.map((s, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-ink2">
                <strong className="min-w-7 rounded-lg bg-primary-soft px-1.5 py-0.5 text-center font-display text-[15px] font-bold text-primary-deep">{s.n}</strong>
                {s.label}
              </li>
            ))}
          </ul>
          {!bundle && <p className="text-sm text-muted">Approve at least one record in step 2 to build an export.</p>}
          {bundle && (
            <div className="flex flex-wrap gap-2.5">
              <Button onClick={download}><FileDown size={15} strokeWidth={2.4} /> Download the Bundle (JSON)</Button>
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(json)}>
                <Copy size={14} strokeWidth={2.4} /> Copy to clipboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {bundle && (
        <Card>
          <CardHeader>
            <CardTitle><Braces size={18} className="text-primary" /> The standards record (FHIR R4 Bundle)</CardTitle>
            <CardDescription>
              This file can be handed to any system that reads FHIR, the same standard hospitals and
              public-health platforms use. The tag at the top states plainly: prototype aligned with a
              draft guide, not a conformance claim.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[460px] overflow-auto rounded-lg bg-[#0f2620] p-4 font-mono text-xs leading-relaxed text-[#c9ebe0]">{json}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
