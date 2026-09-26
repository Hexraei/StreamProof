import { useMemo, useState } from 'react';
import {
  Droplets, PencilLine, ListChecks, ArrowLeftRight, FileDown,
  Upload, FlaskConical, ShieldCheck, Import,
} from 'lucide-react';
import type { RawObservation, ReviewedObservation, ReviewStatus } from './lib/types';
import { validateObservation, canApprove } from './lib/validate';
import { csvToObservations, CSV_HEADER } from './lib/csv';
import { referenceSample, syntheticSample } from './lib/samples';
import { buildBundle } from './lib/fhir';
import { ObservationForm } from './components/ObservationForm';
import { ReviewQueue } from './components/ReviewQueue';
import { MappingPreview } from './components/MappingPreview';
import { BundleView } from './components/BundleView';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { cn } from './lib/utils';

let counter = 0;
const makeId = () => `obs-${Date.now().toString(36)}-${++counter}`;

type Step = 'add' | 'review' | 'mapping' | 'export';

const STEPS: { id: Step; label: string; icon: typeof PencilLine }[] = [
  { id: 'add', label: 'Add data', icon: PencilLine },
  { id: 'review', label: 'Review', icon: ListChecks },
  { id: 'mapping', label: 'Mapping', icon: ArrowLeftRight },
  { id: 'export', label: 'Export', icon: FileDown },
];

export default function App() {
  const [records, setRecords] = useState<ReviewedObservation[]>([]);
  const [step, setStep] = useState<Step>('add');
  const [skippedRows, setSkippedRows] = useState<{ row: number; reason: string }[]>([]);

  const reviewed = useMemo(() => {
    const raws = records.map(({ status: _s, issues: _i, ...raw }) => raw);
    return records.map((rec) => ({ ...rec, issues: validateObservation(rec, raws) }));
  }, [records]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, blocked: 0 };
    for (const r of reviewed) {
      if (r.status === 'approved') c.approved++;
      else if (r.status === 'rejected') c.rejected++;
      else { c.pending++; if (!canApprove(r.issues)) c.blocked++; }
    }
    return c;
  }, [reviewed]);

  const addRecords = (raws: RawObservation[]) => {
    setRecords((prev) => [...prev, ...raws.map((r) => ({ ...r, status: 'pending' as ReviewStatus, issues: [] }))]);
  };
  const updateRecord = (id: string, patch: Partial<RawObservation>) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, status: 'pending' as ReviewStatus } : r)));
  };
  const setStatus = (id: string, status: ReviewStatus) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };
  const removeRecord = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id));

  const importCsv = (text: string) => {
    const { records: raws, skipped } = csvToObservations(text, 'csv', makeId);
    setSkippedRows(skipped);
    if (raws.length) addRecords(raws);
  };

  const approvedRaw: RawObservation[] = reviewed
    .filter((r) => r.status === 'approved')
    .map(({ status: _s, issues: _i, ...raw }) => raw);

  const bundle = useMemo(
    () => (approvedRaw.length ? buildBundle(approvedRaw, new Date().toISOString()) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, records],
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col bg-background shadow-2xl shadow-primary-ink/10 min-[900px]:max-w-[1024px] min-[1280px]:max-w-[1280px]">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-gradient-to-br from-primary-deep via-primary to-aqua px-5 py-4 text-white shadow-lg shadow-primary/30 min-[900px]:px-7 min-[900px]:py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/30 bg-white/15">
          <Droplets size={22} strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-tight min-[900px]:text-2xl">StreamProof</h1>
          <p className="text-[13px] leading-snug text-white/85">
            Citizen stream measurements in. Standards-ready health data out. Guesses stopped at the gate.
          </p>
        </div>
      </header>

      <nav aria-label="Workflow steps" className="mx-4 mt-4 grid grid-cols-2 gap-1.5 rounded-2xl border border-line bg-card p-1.5 shadow-sm min-[560px]:grid-cols-4 min-[900px]:mx-7">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cn(
                'relative flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[13px] font-semibold transition-colors',
                active ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-muted hover:bg-primary-soft hover:text-primary-deep'
              )}
            >
              <span className={cn('font-display text-[11px] font-bold', active ? 'text-white/75' : 'text-muted/60')}>{i + 1}</span>
              <Icon size={14} strokeWidth={2.4} />
              <span className="truncate">{s.label}</span>
              {s.id === 'review' && counts.pending > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-bold text-white">
                  {counts.pending}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4 pb-10 min-[900px]:px-7 min-[900px]:py-5">
        {step === 'add' && (
          <div className="grid items-start gap-4 min-[900px]:grid-cols-[3fr_2fr]">
            <Card className="min-[900px]:row-span-2">
              <CardHeader>
                <CardTitle><PencilLine size={18} className="text-primary" /> Add one measurement</CardTitle>
                <CardDescription>Type in what was measured at the water body. A reviewer checks it before anything is shared.</CardDescription>
              </CardHeader>
              <CardContent>
                <ObservationForm onAdd={(r) => addRecords([{ ...r, id: makeId() }])} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle><Upload size={18} className="text-primary" /> Import a CSV file</CardTitle>
              </CardHeader>
              <CardContent>
                <CsvImport onImport={importCsv} skipped={skippedRows} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle><FlaskConical size={18} className="text-primary" /> Try it with sample data</CardTitle>
                <CardDescription>
                  Two labelled sets: a real published reference record from the OneAquaHealth draft guide
                  (historical, not fresh data), and an invented set full of mistakes so you can watch the gate catch them.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                <Button onClick={() => addRecords(referenceSample(makeId))}>Load the real reference record</Button>
                <Button variant="secondary" onClick={() => addRecords(syntheticSample(makeId))}>Load the flawed synthetic set</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'review' && (
          <ReviewQueue records={reviewed} onUpdate={updateRecord} onSetStatus={setStatus} onRemove={removeRecord} />
        )}
        {step === 'mapping' && <MappingPreview records={reviewed} />}
        {step === 'export' && <BundleView bundle={bundle} counts={counts} pendingBlocked={counts.blocked} />}
      </main>

      <footer className="flex items-start gap-2 border-t border-line px-5 py-4 text-xs text-muted min-[900px]:px-7">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>
          Prototype aligned with the OneAquaHealth draft FHIR Implementation Guide (a draft that can
          change). It is not a formal standards-conformance claim. Built for the OneAquaHealth IEEE
          Global Hackathon 2026, Track 7.
        </span>
      </footer>
    </div>
  );
}

function CsvImport({ onImport, skipped }: { onImport: (text: string) => void; skipped: { row: number; reason: string }[] }) {
  const [text, setText] = useState('');
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-muted">
        Expected columns: <code className="rounded-md bg-primary-soft px-1.5 py-0.5 font-mono text-[11px] text-primary-ink break-all">{CSV_HEADER}</code>
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onImport(await f.text());
        }}
        className="w-full min-w-0 cursor-pointer rounded-xl border-[1.5px] border-dashed border-line bg-primary-soft/50 px-3.5 py-3 text-sm text-ink2 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
      />
      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold text-primary-deep">or paste CSV text</summary>
        <div className="mt-2 flex flex-col gap-2">
          <Textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`${CSV_HEADER}\nMy Stream,2026-09-20T09:15:00Z,pH,7.2,pH,Meena,measured,clear day,,`}
          />
          <Button variant="secondary" size="sm" onClick={() => onImport(text)} className="self-start">
            <Import size={14} strokeWidth={2.4} /> Import pasted text
          </Button>
        </div>
      </details>
      {skipped.length > 0 && (
        <ul className="list-disc pl-5 text-[13px] text-warn">
          {skipped.map((s, i) => (<li key={i}>Row {s.row}: {s.reason}</li>))}
        </ul>
      )}
    </div>
  );
}
