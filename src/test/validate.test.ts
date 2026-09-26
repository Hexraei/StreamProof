import { describe, it, expect } from 'vitest';
import { validateObservation, canApprove, isDuplicate, isValidDate } from '../lib/validate';
import { canonicalUnit } from '../lib/units';
import type { RawObservation } from '../lib/types';

const base: RawObservation = {
  id: 'a1',
  source: 'manual',
  siteName: 'Test Stream',
  observedAt: '2026-09-20T09:15:00Z',
  parameter: 'ph',
  value: 7.2,
  unit: 'pH',
  observer: 'A Reviewer',
  basis: 'measured',
};

describe('units', () => {
  it('canonicalises pH variants', () => {
    expect(canonicalUnit('ph', 'pH')?.ucum).toBe('{pH}');
    expect(canonicalUnit('ph', '')?.ucum).toBe('{pH}');
  });
  it('converts Fahrenheit to Celsius', () => {
    const c = canonicalUnit('water_temperature', 'F');
    expect(c?.ucum).toBe('Cel');
    expect(c?.toCanonical(32)).toBeCloseTo(0);
    expect(c?.toCanonical(212)).toBeCloseTo(100);
  });
  it('converts mS/cm to uS/cm', () => {
    const c = canonicalUnit('conductivity', 'mS/cm');
    expect(c?.toCanonical(18.4)).toBeCloseTo(18400);
  });
  it('accepts micro-Siemens spellings', () => {
    expect(canonicalUnit('conductivity', 'µS/cm')?.ucum).toBe('uS/cm');
    expect(canonicalUnit('conductivity', 'uS/cm')?.ucum).toBe('uS/cm');
  });
  it('rejects nonsense units', () => {
    expect(canonicalUnit('conductivity', 'bananas')).toBeNull();
    expect(canonicalUnit('water_temperature', 'Kelvin')).toBeNull();
  });
});

describe('dates', () => {
  it('accepts ISO dates and datetimes', () => {
    expect(isValidDate('2026-09-20')).toBe(true);
    expect(isValidDate('2026-09-20T09:15:00Z')).toBe(true);
  });
  it('rejects garbage', () => {
    expect(isValidDate('')).toBe(false);
    expect(isValidDate('next Tuesday')).toBe(false);
  });
});

describe('validateObservation', () => {
  it('passes a clean measured record with no issues', () => {
    expect(validateObservation(base)).toEqual([]);
  });
  it('blocks a physically impossible temperature', () => {
    const issues = validateObservation({ ...base, parameter: 'water_temperature', value: 87, unit: '°C' });
    expect(issues.some((i) => i.code === 'implausible-value' && i.severity === 'error')).toBe(true);
    expect(canApprove(issues)).toBe(false);
  });
  it('warns but does not block an atypical pH', () => {
    const issues = validateObservation({ ...base, value: 12.9 });
    expect(issues.some((i) => i.code === 'atypical-value' && i.severity === 'warning')).toBe(true);
    expect(canApprove(issues)).toBe(true);
  });
  it('blocks pH outside 0-14', () => {
    const issues = validateObservation({ ...base, value: 15 });
    expect(issues.some((i) => i.code === 'implausible-value')).toBe(true);
  });
  it('blocks a missing unit on conductivity', () => {
    const issues = validateObservation({ ...base, parameter: 'conductivity', value: 450, unit: '' });
    expect(issues.some((i) => i.code === 'missing-unit' && i.severity === 'error')).toBe(true);
    expect(canApprove(issues)).toBe(false);
  });
  it('blocks an unknown unit', () => {
    const issues = validateObservation({ ...base, parameter: 'conductivity', value: 450, unit: 'bananas' });
    expect(issues.some((i) => i.code === 'unknown-unit')).toBe(true);
  });
  it('blocks a missing value', () => {
    const issues = validateObservation({ ...base, value: null });
    expect(issues.some((i) => i.code === 'non-numeric-value')).toBe(true);
  });
  it('blocks a missing site name', () => {
    const issues = validateObservation({ ...base, siteName: '  ' });
    expect(issues.some((i) => i.code === 'missing-field' && i.field === 'siteName')).toBe(true);
  });
  it('blocks a missing observer', () => {
    const issues = validateObservation({ ...base, observer: '' });
    expect(issues.some((i) => i.code === 'missing-field' && i.field === 'observer')).toBe(true);
  });
  it('blocks an unreadable date', () => {
    const issues = validateObservation({ ...base, observedAt: 'sometime last week' });
    expect(issues.some((i) => i.code === 'invalid-date')).toBe(true);
  });
  it('blocks a photo-only claim with a dedicated error', () => {
    const issues = validateObservation({ ...base, basis: 'photo-only', value: null, unit: '' });
    expect(issues.some((i) => i.code === 'photo-only-claim' && i.severity === 'error')).toBe(true);
    expect(canApprove(issues)).toBe(false);
  });
});

describe('duplicates', () => {
  it('flags same site+parameter+minute', () => {
    const dup = { ...base, id: 'a2' };
    expect(isDuplicate(base, dup)).toBe(true);
    const issues = validateObservation(dup, [base]);
    expect(issues.some((i) => i.code === 'duplicate' && i.severity === 'warning')).toBe(true);
  });
  it('does not flag different minutes or parameters', () => {
    expect(isDuplicate(base, { ...base, id: 'a3', observedAt: '2026-09-20T09:16:30Z' })).toBe(false);
    expect(isDuplicate(base, { ...base, id: 'a4', parameter: 'conductivity', unit: 'uS/cm' })).toBe(false);
    expect(isDuplicate(base, { ...base, id: 'a5', siteName: 'Other Stream' })).toBe(false);
  });
  it('a record is never its own duplicate', () => {
    expect(isDuplicate(base, base)).toBe(false);
  });
});
