import { ArrowLeftRight, Table2 } from 'lucide-react';
import type { ReviewedObservation } from '../lib/types';
import { canonicalUnit } from '../lib/units';
import { PARAMETER_LABELS } from '../lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const ROWS: { from: string; to: string; why: string }[] = [
  { from: 'Site name (+ optional coordinates)', to: 'Location resource', why: 'Every measurement must say where the water was.' },
  { from: 'Parameter (pH / temperature / conductivity)', to: 'Observation.code', why: 'What was measured, in plain words.' },
  { from: 'Value + unit', to: 'Observation.valueQuantity (UCUM unit)', why: 'Units are standardised so any system can read them.' },
  { from: 'Date/time', to: 'Observation.effectiveDateTime', why: 'When the measurement happened.' },
  { from: 'Observer', to: 'Observation.performer', why: 'Who measured - accountability.' },
  { from: 'Human approval', to: 'Observation.status = final', why: 'Only records a person approved become "final".' },
];

export function MappingPreview({ records }: { records: ReviewedObservation[] }) {
  const approved = records.filter((r) => r.status === 'approved');
  return (
    <div className="grid items-start gap-4 min-[1100px]:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle><ArrowLeftRight size={18} className="text-primary" /> How a citizen record becomes a standards record</CardTitle>
          <CardDescription>
            This is the exact translation the export performs. Nothing is added, guessed, or hidden:
            each field in the FHIR record comes from a field the citizen or reviewer supplied.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Citizen input</TableHead>
                <TableHead>Standards field (FHIR R4)</TableHead>
                <TableHead>Why it matters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((r) => (
                <TableRow key={r.from}>
                  <TableCell>{r.from}</TableCell>
                  <TableCell><code className="rounded-md bg-primary-soft px-1.5 py-0.5 font-mono text-xs text-primary-ink">{r.to}</code></TableCell>
                  <TableCell>{r.why}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle><Table2 size={18} className="text-primary" /> Approved records ready for translation ({approved.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {approved.length === 0 ? (
            <p className="text-sm text-muted">No approved records yet. Approve records in step 2 and they will appear here.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Entered as</TableHead>
                  <TableHead>Becomes</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((r) => {
                  const c = canonicalUnit(r.parameter, r.unit);
                  const converted = c && r.value !== null ? `${Math.round(c.toCanonical(r.value) * 1000) / 1000} ${c.display} (${c.ucum})` : '-';
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.siteName}</TableCell>
                      <TableCell>{PARAMETER_LABELS[r.parameter]}</TableCell>
                      <TableCell>{r.value ?? '-'} {r.unit}</TableCell>
                      <TableCell>{converted}</TableCell>
                      <TableCell>{r.observer}</TableCell>
                      <TableCell>{r.observedAt}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
