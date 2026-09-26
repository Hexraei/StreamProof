import { describe, it, expect } from 'vitest';
import { parseCsv, csvToObservations, parseParameter, CSV_HEADER } from '../lib/csv';

let n = 0;
const makeId = () => `c${++n}`;

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });
  it('handles quoted commas and escaped quotes', () => {
    expect(parseCsv('a,b\n"1,000","say ""hi""')).toEqual([['a', 'b'], ['1,000', 'say "hi"']]);
  });
  it('handles CRLF and skips blank lines', () => {
    expect(parseCsv('a,b\r\n1,2\r\n\r\n3,4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
  });
});

describe('parseParameter', () => {
  it('maps aliases', () => {
    expect(parseParameter('pH')).toBe('ph');
    expect(parseParameter('Temperature')).toBe('water_temperature');
    expect(parseParameter('EC')).toBe('conductivity');
    expect(parseParameter('oxygen')).toBeNull();
  });
});

describe('csvToObservations', () => {
  it('parses a valid file', () => {
    const csv = `${CSV_HEADER}\nTest Stream,2026-09-20T09:15:00Z,pH,7.2,pH,Observer One,measured,clean,,\nTest Stream,2026-09-20T09:20:00Z,conductivity,18.4,mS/cm,Observer One,measured,,35.3,25.1`;
    const { records, skipped } = csvToObservations(csv, 'csv', makeId);
    expect(skipped).toEqual([]);
    expect(records).toHaveLength(2);
    expect(records[1].latitude).toBe(35.3);
    expect(records[0].parameter).toBe('ph');
  });
  it('reports missing columns once', () => {
    const { records, skipped } = csvToObservations('site,datetime\nX,2026-09-20', 'csv', makeId);
    expect(records).toEqual([]);
    expect(skipped[0].reason).toMatch(/missing column/);
  });
  it('skips unknown parameters with row numbers', () => {
    const csv = `${CSV_HEADER}\nTest Stream,2026-09-20,oxygen,5,mg/L,Obs,measured,,,`;
    const { records, skipped } = csvToObservations(csv, 'csv', makeId);
    expect(records).toEqual([]);
    expect(skipped[0].row).toBe(2);
    expect(skipped[0].reason).toMatch(/unknown parameter/);
  });
  it('skips non-numeric values', () => {
    const csv = `${CSV_HEADER}\nTest Stream,2026-09-20,pH,high,pH,Obs,measured,,,`;
    const { records, skipped } = csvToObservations(csv, 'csv', makeId);
    expect(records).toEqual([]);
    expect(skipped[0].reason).toMatch(/not a number/);
  });
  it('reads photo-only basis', () => {
    const csv = `${CSV_HEADER}\nTest Stream,2026-09-20,conductivity,,uS/cm,Obs,photo-only,green in photo,,`;
    const { records } = csvToObservations(csv, 'csv', makeId);
    expect(records[0].basis).toBe('photo-only');
    expect(records[0].value).toBeNull();
  });
});
