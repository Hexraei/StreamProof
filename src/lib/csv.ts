import type { Parameter, RawObservation, SourceKind, Basis } from './types';

/** Minimal CSV parser: handles quotes, commas inside quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else cell += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cell); cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

const PARAM_ALIASES: Record<string, Parameter> = {
  ph: 'ph',
  'water temperature': 'water_temperature',
  temperature: 'water_temperature',
  temp: 'water_temperature',
  water_temp: 'water_temperature',
  conductivity: 'conductivity',
  ec: 'conductivity',
  'electrical conductivity': 'conductivity',
};

export function parseParameter(s: string): Parameter | null {
  return PARAM_ALIASES[s.trim().toLowerCase()] ?? null;
}

export const CSV_HEADER = 'site,datetime,parameter,value,unit,observer,basis,notes,lat,lon';

/**
 * Convert CSV text into raw observations. Unparseable rows are skipped and
 * reported by row number so the user can fix the file.
 */
export function csvToObservations(
  text: string,
  source: SourceKind,
  makeId: () => string,
): { records: RawObservation[]; skipped: { row: number; reason: string }[] } {
  const rows = parseCsv(text);
  if (rows.length === 0) return { records: [], skipped: [{ row: 0, reason: 'empty file' }] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const required = ['site', 'datetime', 'parameter', 'value', 'unit', 'observer'];
  const missing = required.filter((r) => col(r) === -1);
  if (missing.length) {
    return { records: [], skipped: [{ row: 1, reason: `missing column(s): ${missing.join(', ')}. Expected header: ${CSV_HEADER}` }] };
  }
  const records: RawObservation[] = [];
  const skipped: { row: number; reason: string }[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const get = (name: string) => (col(name) >= 0 ? (r[col(name)] ?? '').trim() : '');
    const parameter = parseParameter(get('parameter'));
    if (!parameter) {
      skipped.push({ row: i + 1, reason: `unknown parameter "${get('parameter')}" (use pH, temperature, or conductivity)` });
      continue;
    }
    const rawValue = get('value');
    const value = rawValue === '' ? null : Number(rawValue);
    if (rawValue !== '' && Number.isNaN(value)) {
      skipped.push({ row: i + 1, reason: `value "${rawValue}" is not a number` });
      continue;
    }
    const basisRaw = get('basis').toLowerCase();
    const basis: Basis = basisRaw === 'photo-only' || basisRaw === 'photo' ? 'photo-only' : basisRaw === 'estimated' ? 'estimated' : 'measured';
    const lat = get('lat') === '' ? null : Number(get('lat'));
    const lon = get('lon') === '' ? null : Number(get('lon'));
    records.push({
      id: makeId(),
      source,
      siteName: get('site'),
      observedAt: get('datetime'),
      parameter,
      value,
      unit: get('unit'),
      observer: get('observer'),
      basis,
      notes: get('notes') || undefined,
      latitude: lat !== null && !Number.isNaN(lat) ? lat : null,
      longitude: lon !== null && !Number.isNaN(lon) ? lon : null,
    });
  }
  return { records, skipped };
}
