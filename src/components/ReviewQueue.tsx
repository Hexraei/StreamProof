import type { RawObservation, ReviewedObservation, ReviewStatus } from '../lib/types';
import { canApprove } from '../lib/validate';
import { PARAMETER_LABELS } from '../lib/types';

interface Props {
  records: ReviewedObservation[];
  onUpdate: (id: string, patch: Partial<RawObservation>) => void;
  onSetStatus: (id: string, status: ReviewStatus) => void;
  onRemove: (id: string) => void;
}

export default function ReviewQueue({ records, onUpdate, onSetStatus, onRemove }: Props) {
  if (records.length === 0) {
    return (
      <div className="panel">
        <h2>Nothing to review yet</h2>
        <p>Go back to step 1 and add a measurement, import a CSV, or load a sample set.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="panel">
        <h2>Review queue</h2>
        <p>
          Every record is checked by fixed rules before it can become a standards record. Red items
          are blocked until a human fixes or rejects them. Amber items can be approved, but a person
          should read them first. Nothing is auto-approved.
        </p>
      </div>
      {records.map((rec) => {
        const approvable = canApprove(rec.issues);
        return (
          <div key={rec.id} className={`card status-${rec.status}`}>
            <div className="card-head">
              <strong>{PARAMETER_LABELS[rec.parameter]}</strong>
              <span>{rec.siteName}</span>
              <span className="muted">{rec.observedAt || 'no date'}</span>
              <span className={`pill pill-${rec.status}`}>{rec.status}</span>
              {rec.source !== 'manual' && rec.source !== 'csv' && (
                <span className="pill pill-source">{rec.source === 'reference-sample' ? 'reference' : 'synthetic'}</span>
              )}
            </div>
            <div className="card-body">
              <label>
                Value
                <input
                  value={rec.value ?? ''}
                  onChange={(e) => onUpdate(rec.id, { value: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </label>
              <label>
                Unit
                <input value={rec.unit} onChange={(e) => onUpdate(rec.id, { unit: e.target.value })} />
              </label>
              <label>
                Observer
                <input value={rec.observer} onChange={(e) => onUpdate(rec.id, { observer: e.target.value })} />
              </label>
              <label>
                Basis
                <select
                  value={rec.basis}
                  onChange={(e) => onUpdate(rec.id, { basis: e.target.value as RawObservation['basis'] })}
                >
                  <option value="measured">Measured with an instrument</option>
                  <option value="estimated">Estimated</option>
                  <option value="photo-only">Photo-only claim</option>
                </select>
              </label>
            </div>
            {rec.issues.length > 0 && (
              <ul className="issues">
                {rec.issues.map((iss, i) => (
                  <li key={i} className={iss.severity === 'error' ? 'issue-error' : 'issue-warning'}>
                    {iss.severity === 'error' ? 'BLOCKED' : 'CHECK'} - {iss.message}
                  </li>
                ))}
              </ul>
            )}
            {rec.notes && <p className="muted">Note: {rec.notes}</p>}
            <div className="card-actions">
              <button disabled={!approvable || rec.status === 'approved'} onClick={() => onSetStatus(rec.id, 'approved')}>
                {rec.status === 'approved' ? 'Approved' : 'Approve'}
              </button>
              <button disabled={rec.status === 'rejected'} onClick={() => onSetStatus(rec.id, 'rejected')}>
                {rec.status === 'rejected' ? 'Rejected' : 'Reject'}
              </button>
              <button className="link" onClick={() => onRemove(rec.id)}>Remove</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
