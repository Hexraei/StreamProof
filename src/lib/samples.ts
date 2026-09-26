import type { RawObservation } from './types';

/**
 * Two clearly-labelled sample sets.
 *
 * 1. REFERENCE: a real, dated example published in the OneAquaHealth draft
 *    FHIR Implementation Guide (Almyros monitoring reach, electrical
 *    conductivity 18.4 mS/cm on 2024-11-21, performer OneAquaHealth Crete Lab;
 *    source: build.fhir.org/ig/hl7-eu/oah/Observation-Obs-EC-Almyros-2024-11-21.html).
 *    It is historical reference data, shown so reviewers can see what a good
 *    record looks like. It is NOT fresh citizen data and is labelled as such.
 *
 * 2. SYNTHETIC: an invented, deliberately flawed set used to demonstrate the
 *    validation gate - a clean record, an impossible temperature, a missing
 *    unit, a duplicate, an atypical pH, and a photo-only claim.
 */
export function referenceSample(makeId: () => string): RawObservation[] {
  return [
    {
      id: makeId(),
      source: 'reference-sample',
      siteName: 'Almyros monitoring reach (Crete, Greece)',
      observedAt: '2024-11-21T00:00:00Z',
      parameter: 'conductivity',
      value: 18.4,
      unit: 'mS/cm',
      observer: 'OneAquaHealth Crete Lab',
      basis: 'measured',
      notes:
        'REFERENCE EXAMPLE from the OneAquaHealth draft FHIR IG (Obs-EC-Almyros-2024-11-21). Historical published data, not a fresh citizen measurement.',
    },
  ];
}

export function syntheticSample(makeId: () => string): RawObservation[] {
  const base = {
    source: 'synthetic-sample' as const,
    observer: 'Demo Observer (synthetic)',
  };
  return [
    {
      ...base,
      id: makeId(),
      siteName: 'Demo Stream A (synthetic)',
      observedAt: '2026-09-20T09:15:00Z',
      parameter: 'ph',
      value: 7.2,
      unit: 'pH',
      basis: 'measured',
      notes: 'SYNTHETIC demo record - clean, should pass review.',
    },
    {
      ...base,
      id: makeId(),
      siteName: 'Demo Stream A (synthetic)',
      observedAt: '2026-09-20T09:20:00Z',
      parameter: 'water_temperature',
      value: 87,
      unit: '°C',
      basis: 'measured',
      notes: 'SYNTHETIC demo record - impossible temperature, should be blocked.',
    },
    {
      ...base,
      id: makeId(),
      siteName: 'Demo Stream A (synthetic)',
      observedAt: '2026-09-20T09:25:00Z',
      parameter: 'conductivity',
      value: 450,
      unit: '',
      basis: 'measured',
      notes: 'SYNTHETIC demo record - missing unit, should be blocked.',
    },
    {
      ...base,
      id: makeId(),
      siteName: 'Demo Stream A (synthetic)',
      observedAt: '2026-09-20T09:15:00Z',
      parameter: 'ph',
      value: 7.2,
      unit: 'pH',
      basis: 'measured',
      notes: 'SYNTHETIC demo record - duplicate of the clean pH record.',
    },
    {
      ...base,
      id: makeId(),
      siteName: 'Demo Stream B (synthetic)',
      observedAt: '2026-09-21T14:00:00Z',
      parameter: 'ph',
      value: 12.9,
      unit: 'pH',
      basis: 'measured',
      notes: 'SYNTHETIC demo record - atypical pH, reviewer must confirm.',
    },
    {
      ...base,
      id: makeId(),
      siteName: 'Demo Stream B (synthetic)',
      observedAt: '2026-09-21T14:05:00Z',
      parameter: 'conductivity',
      value: null,
      unit: '',
      basis: 'photo-only',
      observer: 'Demo Observer (synthetic)',
      notes: 'SYNTHETIC demo record - "the water looked green in a photo, probably an algal bloom". A photo claim, not a measurement.',
    },
  ];
}
