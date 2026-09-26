import type { ReviewedObservation } from '../lib/types';
import { canonicalUnit } from '../lib/units';
import { PARAMETER_LABELS } from '../lib/types';

const ROWS: { from: string; to: string; why: string }[] = [
  { from: 'Site name (+ optional coordinates)', to: 'Location resource', why: 'Every measurement must say where the water was.' },
  { from: 'Parameter (pH / temperature / conductivity)', to: 'Observation.code', why: 'What was measured, in plain words.' },
  { from: 'Value + unit', to: 'Observation.valueQuantity (UCUM unit)', why: 'Units are standardised so any system can read them.' },
  { from: 'Date/time', to: 'Observation.effectiveDateTime', why: 'When the measurement happened.' },
  { from: 'Observer', to: 'Observation.performer', why: 'Who measured - accountability.' },
  { from: 'Human approval', to: 'Observation.status = final', why: 'Only records a person approved become "final".' },
];

export default function MappingPreview({ records }: { records: ReviewedObservation[] }) {
  const approved = records.filter((r) => r.status === 'approved');
  return (
    <div>
      <div className="panel">
        <h2>How a citizen record becomes a standards record</h2>
        <p>
          This is the exact translation the export performs. Nothing is added, guessed, or hidden:
          each field in the FHIR record comes from a field the citizen or reviewer supplied.
        </p>
        <table>
          <thead>
            <tr><th>Citizen input</th><th>Standards field (FHIR R4)</th><th>Why it matters</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.from}><td>{r.from}</td><td><code>{r.to}</code></td><td>{r.why}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <h2>Approved records ready for translation ({approved.length})</h2>
        {approved.length === 0 ? (
          <p>No approved records yet. Approve records in step 2 and they will appear here.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Site</th><th>Parameter</th><th>Entered as</th><th>Becomes</th><th>By</th><th>When</th></tr>
            </thead>
            <tbody>
              {approved.map((r) => {
                const c = canonicalUnit(r.parameter, r.unit);
                const converted = c && r.value !== null ? `${Math.round(c.toCanonical(r.value) * 1000) / 1000} ${c.display} (${c.ucum})` : '-';
                return (
                  <tr key={r.id}>
                    <td>{r.siteName}</td>
                    <td>{PARAMETER_LABELS[r.parameter]}</td>
                    <td>{r.value ?? '-'} {r.unit}</td>
                    <td>{converted}</td>
                    <td>{r.observer}</td>
                    <td>{r.observedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
