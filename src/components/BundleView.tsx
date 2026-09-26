import { FileDown, Copy, Braces } from 'lucide-react';
import type { FhirBundle } from '../lib/fhir';

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

  return (
    <div>
      <div className="panel">
        <h2><FileDown size={19} className="ic" /> Export summary</h2>
        <ul className="summary">
          <li><strong>{counts.approved}</strong> approved records - these are in the export</li>
          <li><strong>{counts.rejected}</strong> rejected by a human reviewer - excluded</li>
          <li><strong>{counts.pending}</strong> still waiting for review - excluded</li>
          {pendingBlocked > 0 && (
            <li><strong>{pendingBlocked}</strong> of the waiting records are blocked by rule errors and can never be approved as-is</li>
          )}
        </ul>
        {!bundle && <p>Approve at least one record in step 2 to build an export.</p>}
        {bundle && (
          <div className="card-actions">
            <button onClick={download}><FileDown size={16} strokeWidth={2.4} /> Download the Bundle (JSON)</button>
            <button className="secondary" onClick={() => navigator.clipboard.writeText(json)}><Copy size={15} strokeWidth={2.4} /> Copy to clipboard</button>
          </div>
        )}
      </div>
      {bundle && (
        <div className="panel">
          <h2><Braces size={19} className="ic" /> The standards record (FHIR R4 Bundle)</h2>
          <p className="hint">
            This file can be handed to any system that reads FHIR, the same standard hospitals and
            public-health platforms use. The tag at the top states plainly: prototype aligned with a
            draft guide, not a conformance claim.
          </p>
          <pre className="json">{json}</pre>
        </div>
      )}
    </div>
  );
}
