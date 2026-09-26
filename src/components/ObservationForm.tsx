import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import type { Parameter, RawObservation } from '../lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const PARAMS: { value: Parameter; label: string; unitHint: string }[] = [
  { value: 'ph', label: 'pH', unitHint: 'pH' },
  { value: 'water_temperature', label: 'Water temperature', unitHint: '°C' },
  { value: 'conductivity', label: 'Conductivity', unitHint: 'µS/cm' },
];

export function ObservationForm({ onAdd }: { onAdd: (rec: Omit<RawObservation, 'id'>) => void }) {
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
    <div className="grid gap-3.5">
      <Label>
        Where was the water measured?
        <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. Adyar River, near the footbridge" />
      </Label>
      <div className="grid grid-cols-2 gap-3">
        <Label>
          When?
          <Input type="datetime-local" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} />
        </Label>
        <Label>
          Who measured it?
          <Input value={observer} onChange={(e) => setObserver(e.target.value)} placeholder="e.g. Meena / Green Club" />
        </Label>
      </div>
      <Label>
        What was measured?
        <Select
          value={parameter}
          onValueChange={(p) => {
            const param = p as Parameter;
            setParameter(param);
            setUnit(PARAMS.find((x) => x.value === param)!.unitHint);
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PARAMS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>
      <div className="grid grid-cols-2 gap-3">
        <Label>
          Value
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 7.2" inputMode="decimal" />
        </Label>
        <Label>
          Unit
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={PARAMS.find((x) => x.value === parameter)!.unitHint} />
        </Label>
      </div>
      <Label>
        Notes (optional)
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything a reviewer should know" />
      </Label>
      <Button onClick={submit} className="mt-1">
        <PlusCircle size={16} strokeWidth={2.4} />
        {added ? 'Added - check the Review step' : 'Add measurement'}
      </Button>
    </div>
  );
}
