import { describe, it, expect } from 'vitest';
import { buildBundle, buildObservation, buildLocation, slugify } from '../lib/fhir';
import { referenceSample, syntheticSample } from '../lib/samples';
import { validateObservation, canApprove } from '../lib/validate';
import type { RawObservation } from '../lib/types';

let n = 0;
const makeId = () => `t${++n}`;

const good: RawObservation = {
  id: 'g1',
  source: 'manual',
  siteName: 'Test Stream',
  observedAt: '2026-09-20T09:15:00Z',
  parameter: 'conductivity',
  value: 18.4,
  unit: 'mS/cm',
  observer: 'Test Observer',
  basis: 'measured',
};

describe('fhir builders', () => {
  it('slugifies site names', () => {
    expect(slugify('Almyros monitoring reach (Crete, Greece)')).toBe('almyros-monitoring-reach-crete-greece');
  });
  it('builds a Location without position when no coordinates', () => {
    const loc = buildLocation(good);
    expect(loc.resourceType).toBe('Location');
    expect(loc.name).toBe('Test Stream');
    expect(loc.position).toBeUndefined();
  });
  it('includes position when coordinates exist', () => {
    const loc = buildLocation({ ...good, latitude: 35.3, longitude: 25.1 });
    expect(loc.position).toEqual({ latitude: 35.3, longitude: 25.1 });
  });
  it('builds an Observation with UCUM unit and converted value', () => {
    const obs = buildObservation(good, 1);
    expect(obs.status).toBe('final');
    expect(obs.valueQuantity.code).toBe('uS/cm');
    expect(obs.valueQuantity.value).toBe(18400);
    expect(obs.subject.reference).toBe('Location/loc-test-stream');
    expect(obs.performer[0].display).toBe('Test Observer');
    expect(obs.effectiveDateTime).toBe('2026-09-20T09:15:00.000Z');
  });
  it('throws on a record without a recognised unit', () => {
    expect(() => buildObservation({ ...good, unit: 'bananas' }, 1)).toThrow();
  });
  it('builds a Bundle with one Location per site plus Observations', () => {
    const other: RawObservation = { ...good, id: 'g2', parameter: 'ph', value: 7.1, unit: 'pH' };
    const bundle = buildBundle([good, other], '2026-09-27T00:00:00.000Z');
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');
    const kinds = bundle.entry.map((e) => e.resource.resourceType);
    expect(kinds.filter((k) => k === 'Location')).toHaveLength(1);
    expect(kinds.filter((k) => k === 'Observation')).toHaveLength(2);
    expect(bundle.meta.tag[0].code).toBe('draft-ig-prototype');
  });
  it('marks the bundle as draft-IG prototype, not conformance', () => {
    const bundle = buildBundle([good], '2026-09-27T00:00:00.000Z');
    expect(bundle.meta.tag[0].display).toMatch(/Not a conformance claim/);
  });
});

describe('samples', () => {
  it('reference sample is the real Almyros example and passes validation', () => {
    const [ref] = referenceSample(makeId);
    expect(ref.value).toBe(18.4);
    expect(ref.unit).toBe('mS/cm');
    expect(ref.observedAt).toContain('2024-11-21');
    expect(ref.observer).toBe('OneAquaHealth Crete Lab');
    const issues = validateObservation(ref);
    expect(canApprove(issues)).toBe(true);
  });
  it('synthetic sample is labelled synthetic and contains each failure mode', () => {
    const syn = syntheticSample(makeId);
    expect(syn.every((r) => r.source === 'synthetic-sample')).toBe(true);
    const allIssues = syn.map((r) => validateObservation(r, syn));
    const codes = allIssues.flat().map((i) => i.code);
    expect(codes).toContain('implausible-value');
    expect(codes).toContain('missing-unit');
    expect(codes).toContain('duplicate');
    expect(codes).toContain('photo-only-claim');
    expect(codes).toContain('atypical-value');
  });
  it('the clean synthetic record passes', () => {
    const syn = syntheticSample(makeId);
    const clean = syn[0];
    expect(validateObservation(clean, syn).filter((i) => i.code !== 'duplicate')).toEqual([]);
  });
});
