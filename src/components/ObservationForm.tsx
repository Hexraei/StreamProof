import { useState } from 'react';
import type { Parameter, RawObservation } from '../lib/types';

const PARAMS: { value: Parameter; label: string; unitHint: string }[] = [
  { value: 'ph', label: 'pH', unitHint: 'pH' },
  { value: 'water_temperature', label: 'Water temperature', unitHint: '°C' },
  { value: 'conductivity', label: 'Conductivity', unitHint: 'µS/cm' },
];

export default function ObservationForm({ onAdd }: { onAdd: (rec: Omit<RawObservation, 'id'>) => void }) {
  const [siteName, setSiteName] = useState('');
  const [observedAt, setObservedAt] = useState('');
  const [parameter, setParameter] = useState<Parameter>('ph');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('pH');
  const [observer, setObserver] = useState('');
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);

  const submit = () => {
    onAdd({
      source: 'manual',
      siteName,
      observedAt,
      parameter,
      value: value.trim() === '' ? null : Number(value),
      unit,
      observer,
      basis: 'measured',
      notes: notes || undefined,
    });
    setValue('');
    setNotes('');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="form">
      <label>
        Where was the water measured?
        <input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. Adyar River, near the footbridge" />
      </label>
      <label>
        When?
        <input type="datetime-local" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} />
      </label>
      <label>
        What was measured?
        <select
          value={parameter}
          onChange={(e) => {
            const p = e.target.value as Parameter;
            setParameter(p);
            setUnit(PARAMS.find((x) => x.value === p)!.unitHint);
          }}
        >
          {PARAMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>
      <div className="row">
        <label>
          Value
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 7.2" inputMode="decimal" />
        </label>
        <label>
          Unit
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={PARAMS.find((x) => x.value === parameter)!.unitHint} />
        </label>
      </div>
      <label>
        Who measured it?
        <input value={observer} onChange={(e) => setObserver(e.target.value)} placeholder="Name or group, e.g. Meena / Green Club" />
      </label>
      <label>
        Notes (optional)
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything a reviewer should know" />
      </label>
      <button onClick={submit}>{added ? 'Added - check the Review step' : 'Add measurement'}</button>
    </div>
  );
}
