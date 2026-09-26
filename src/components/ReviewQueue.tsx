import { ListChecks, MapPin, Calendar, Check, X, User, Inbox } from 'lucide-react';
import type { RawObservation, ReviewedObservation, ReviewStatus } from '../lib/types';
import { canApprove } from '../lib/validate';
import { PARAMETER_LABELS } from '../lib/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
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

const statusText: Record<ReviewStatus, string> = {
  pending: 'text-warn',
  approved: 'text-ok',
  rejected: 'text-bad',
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
    <div className="grid gap-4 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
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
        const sourceNote =
          rec.source === 'manual' ? 'typed in' : rec.source === 'csv' ? 'from CSV' : rec.source === 'reference-sample' ? 'reference sample' : 'synthetic demo';
        return (
          <Card key={rec.id}>
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-center gap-2">
                <strong className="font-display text-[15px]">{PARAMETER_LABELS[rec.parameter]}</strong>
                <span className="text-xs text-muted">{sourceNote}</span>
                <span className={cn('ml-auto text-[11px] font-bold uppercase tracking-[0.08em]', statusText[rec.status])}>
                  {rec.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-ink2">
                <span className="inline-flex min-w-0 flex-1 items-center gap-1">
                  <MapPin size={12} className="shrink-0 text-muted" />
                  <span className="truncate">{rec.siteName || 'no site'}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted">
                  <Calendar size={12} /> {rec.observedAt ? rec.observedAt.slice(5, 16).replace('T', ' ') : 'no date'}
                </span>
              </div>
              <div className="flex items-end gap-2.5">
                <Label className="flex-1">
                  Value
                  <Input
                    className="h-12 font-mono text-2xl font-bold tracking-tight"
                    value={rec.value ?? ''}
                    onChange={(e) => onUpdate(rec.id, { value: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                </Label>
                <Label className="w-28 shrink-0">
                  Unit
                  <Input
                    className={cn('h-12 font-mono', rec.unit === '' && 'border-dashed text-muted italic placeholder:text-muted placeholder:italic')}
                    placeholder={rec.unit === '' ? 'missing' : undefined}
                    value={rec.unit}
                    onChange={(e) => onUpdate(rec.id, { unit: e.target.value })}
                  />
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
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
                <div className="flex flex-col gap-1.5 border-t border-line pt-2.5">
                  {rec.issues.map((iss, i) => (
                    <p key={i} className="py-0.5 text-[13px] leading-snug text-ink">
                      <strong className={cn('font-bold', iss.severity === 'error' ? 'text-bad' : 'text-warn')}>
                        {iss.severity === 'error' ? 'Blocked:' : 'Check:'}
                      </strong>{' '}
                      {iss.message}
                    </p>
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
