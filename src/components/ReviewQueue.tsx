import { OctagonAlert, TriangleAlert, ListChecks, MapPin, Calendar, Check, X, User, Inbox } from 'lucide-react';
import type { RawObservation, ReviewedObservation, ReviewStatus } from '../lib/types';
import { canApprove } from '../lib/validate';
import { PARAMETER_LABELS } from '../lib/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '../lib/utils';

interface Props {
  records: ReviewedObservation[];
  onUpdate: (id: string, patch: Partial<RawObservation>) => void;
  onSetStatus: (id: string, status: ReviewStatus) => void;
  onRemove: (id: string) => void;
}

const accent: Record<ReviewStatus, string> = {
  pending: 'border-l-warn',
  approved: 'border-l-ok',
  rejected: 'border-l-bad opacity-80',
};

export function ReviewQueue({ records, onUpdate, onSetStatus, onRemove }: Props) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Inbox size={28} className="text-primary" />
          <p className="font-display text-base font-bold">Nothing to review yet</p>
          <p className="text-sm text-muted">Go back to step 1 and add a measurement, import a CSV, or load the example data.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid items-start gap-4 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
      <Card className="min-[900px]:col-span-full">
        <CardContent className="flex items-start gap-3 py-4">
          <ListChecks size={19} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-ink2">
            Every record is checked by fixed rules before it can become a standards record. Red items
            are blocked until a human fixes or rejects them. Amber items can be approved, but a person
            should read them first. <strong>Nothing is auto-approved.</strong>
          </p>
        </CardContent>
      </Card>
      {records.map((rec) => {
        const approvable = canApprove(rec.issues);
        return (
          <Card key={rec.id} className={cn('border-l-4', accent[rec.status])}>
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <strong className="font-display text-[15px]">{PARAMETER_LABELS[rec.parameter]}</strong>
                <span className="inline-flex items-center gap-1 text-[13px] text-ink2">
                  <MapPin size={12} className="text-muted" /> {rec.siteName || 'no site'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Calendar size={12} /> {rec.observedAt ? rec.observedAt.replace('T', ' ') : 'no date'}
                </span>
                <Badge variant={rec.status}>{rec.status}</Badge>
                {rec.source !== 'manual' && rec.source !== 'csv' && (
                  <Badge variant="violet">{rec.source === 'reference-sample' ? 'reference' : 'synthetic'}</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Label>
                  Value
                  <Input
                    value={rec.value ?? ''}
                    onChange={(e) => onUpdate(rec.id, { value: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                </Label>
                <Label>
                  Unit
                  <Input value={rec.unit} onChange={(e) => onUpdate(rec.id, { unit: e.target.value })} />
                </Label>
                <Label>
                  Observer
                  <Input value={rec.observer} onChange={(e) => onUpdate(rec.id, { observer: e.target.value })} />
                </Label>
                <Label>
                  Basis
                  <Select
                    value={rec.basis}
                    onValueChange={(v) => onUpdate(rec.id, { basis: v as RawObservation['basis'] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="measured">Measured with an instrument</SelectItem>
                      <SelectItem value="estimated">Estimated</SelectItem>
                      <SelectItem value="photo-only">Photo-only claim</SelectItem>
                    </SelectContent>
                  </Select>
                </Label>
              </div>
              {rec.issues.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {rec.issues.map((iss, i) => (
                    <Alert key={i} variant={iss.severity === 'error' ? 'destructive' : 'warning'}>
                      {iss.severity === 'error' ? <OctagonAlert size={15} /> : <TriangleAlert size={15} />}
                      <span><strong className="text-[11px] font-extrabold uppercase tracking-wide">{iss.severity === 'error' ? 'Blocked' : 'Check'}</strong>{' - '}{iss.message}</span>
                    </Alert>
                  ))}
                </div>
              )}
              {rec.notes && (
                <p className="inline-flex items-start gap-1.5 text-[13px] text-muted">
                  <User size={12} className="mt-0.5 shrink-0" /> Note: {rec.notes}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" disabled={!approvable || rec.status === 'approved'} onClick={() => onSetStatus(rec.id, 'approved')}>
                  <Check size={14} strokeWidth={2.6} /> {rec.status === 'approved' ? 'Approved' : 'Approve'}
                </Button>
                <Button size="sm" variant="secondary" disabled={rec.status === 'rejected'} onClick={() => onSetStatus(rec.id, 'rejected')}>
                  <X size={14} strokeWidth={2.6} /> {rec.status === 'rejected' ? 'Rejected' : 'Reject'}
                </Button>
                <Button size="sm" variant="link" onClick={() => onRemove(rec.id)}>Remove</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
