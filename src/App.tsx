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
    return records.map((rec) => ({
      ...rec,
      issues: validateObservation(rec, raws),
    }));
  }, [records]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, blocked: 0 };
    for (const r of reviewed) {
      if (r.status === 'approved') c.approved++;
      else if (r.status === 'rejected') c.rejected++;
      else {
        c.pending++;
        if (!canApprove(r.issues)) c.blocked++;
      }
    }
    return c;
  }, [reviewed]);

  const addRecords = (raws: RawObservation[]) => {
    setRecords((prev) => [
      ...prev,
      ...raws.map((r) => ({ ...r, status: 'pending' as ReviewStatus, issues: [] })),
    ]);
  };

  const updateRecord = (id: string, patch: Partial<RawObservation>) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, status: 'pending' as ReviewStatus } : r)));
  };

  const setStatus = (id: string, status: ReviewStatus) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const removeRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

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
    <div className="app">
      <header className="topbar">
        <span className="logo-mark"><Droplets size={22} strokeWidth={2.2} /></span>
        <div>
          <h1 className="logo">StreamProof</h1>
          <p className="tagline">
            Citizen stream measurements in. Standards-ready health data out. Guesses stopped at the gate.
          </p>
        </div>
      </header>

      <nav className="steps" aria-label="Workflow steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              className={step === s.id ? 'step active' : 'step'}
              onClick={() => setStep(s.id)}
            >
              <span className="n">{i + 1}</span>
              <Icon size={15} strokeWidth={2.4} />
              {s.label}
              {s.id === 'review' && counts.pending > 0 && <span className="badge">{counts.pending}</span>}
            </button>
          );
        })}
      </nav>

      <main>
        {step === 'add' && (
          <section>
            <div className="panel">
              <h2><PencilLine size={19} className="ic" /> Add one measurement</h2>
              <ObservationForm onAdd={(r) => addRecords([{ ...r, id: makeId() }])} />
            </div>
            <div className="panel">
              <h2><Upload size={19} className="ic" /> Import a CSV file</h2>
              <CsvImport onImport={importCsv} skipped={skippedRows} />
            </div>
            <div className="panel">
              <h2><FlaskConical size={19} className="ic" /> Try it with sample data</h2>
              <p>
                Two labelled sets: a real published reference record from the OneAquaHealth draft
                guide (historical, not fresh data), and an invented set full of mistakes so you can
                watch the gate catch them.
              </p>
              <div className="btn-row">
                <button onClick={() => addRecords(referenceSample(makeId))}>Load the real reference record</button>
                <button className="secondary" onClick={() => addRecords(syntheticSample(makeId))}>Load the flawed synthetic set</button>
              </div>
            </div>
          </section>
        )}

        {step === 'review' && (
          <ReviewQueue
            records={reviewed}
            onUpdate={updateRecord}
            onSetStatus={setStatus}
            onRemove={removeRecord}
          />
        )}

        {step === 'mapping' && <MappingPreview records={reviewed} />}

        {step === 'export' && (
          <BundleView bundle={bundle} counts={counts} pendingBlocked={counts.blocked} />
        )}
      </main>

      <footer>
        <ShieldCheck size={15} />
        <span>
          Prototype aligned with the OneAquaHealth draft FHIR Implementation Guide (a draft that can
          change). It is not a formal standards-conformance claim. Built for the OneAquaHealth IEEE
          Global Hackathon 2026, Track 7.
        </span>
      </footer>
    </div>
  );
}

function CsvImport({
  onImport,
  skipped,
}: {
  onImport: (text: string) => void;
  skipped: { row: number; reason: string }[];
}) {
  const [text, setText] = useState('');
  return (
    <div>
      <p className="hint">
        Expected columns: <code>{CSV_HEADER}</code>
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onImport(await f.text());
        }}
      />
      <details>
        <summary>or paste CSV text</summary>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`${CSV_HEADER}\nMy Stream,2026-09-20T09:15:00Z,pH,7.2,pH,Meena,measured,clear day,,`}
        />
        <button className="secondary" onClick={() => onImport(text)}>
          <Import size={15} strokeWidth={2.4} /> Import pasted text
        </button>
      </details>
      {skipped.length > 0 && (
        <ul className="skipped">
          {skipped.map((s, i) => (
            <li key={i}>Row {s.row}: {s.reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
