import type { RawObservation } from './types';
import { canonicalUnit } from './units';
import { PARAMETER_LABELS } from './types';

/**
 * FHIR R4 builders.
 *
 * Output shape follows the OneAquaHealth draft Implementation Guide examples
 * (Location + Observation: status, code, subject Location, effective time,
 * performer, value with UCUM unit). The IG is an unauthorised, changeable
 * draft, so this is "aligned with the current draft", NOT a conformance claim.
 */

export interface FhirLocation {
  resourceType: 'Location';
  id: string;
  name: string;
  position?: { latitude: number; longitude: number };
}

export interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  status: 'final';
  code: { text: string };
  subject: { reference: string; display: string };
  effectiveDateTime: string;
  performer: { display: string }[];
  valueQuantity: { value: number; unit: string; system: 'http://unitsofmeasure.org'; code: string };
}

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'collection';
  timestamp: string;
  meta: { tag: { system: string; code: string; display: string }[] };
  entry: { fullUrl: string; resource: FhirLocation | FhirObservation }[];
}

export function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
}

export function buildLocation(rec: RawObservation): FhirLocation {
  const loc: FhirLocation = {
    resourceType: 'Location',
    id: `loc-${slugify(rec.siteName)}`,
    name: rec.siteName.trim(),
  };
  if (typeof rec.latitude === 'number' && typeof rec.longitude === 'number') {
    loc.position = { latitude: rec.latitude, longitude: rec.longitude };
  }
  return loc;
}

/** Build one Observation from an APPROVED, error-free record. Throws on bad input - export must filter first. */
export function buildObservation(rec: RawObservation, index: number): FhirObservation {
  const canonical = canonicalUnit(rec.parameter, rec.unit);
  if (!canonical) throw new Error(`Record ${rec.id} has no recognised unit`);
  if (rec.value === null || Number.isNaN(rec.value)) throw new Error(`Record ${rec.id} has no numeric value`);
  if (!rec.observer.trim()) throw new Error(`Record ${rec.id} has no observer`);
  const rounded = Math.round(canonical.toCanonical(rec.value) * 1000) / 1000;
  return {
    resourceType: 'Observation',
    id: `obs-${slugify(rec.siteName)}-${rec.parameter}-${index}`,
    status: 'final',
    code: { text: PARAMETER_LABELS[rec.parameter] },
    subject: { reference: `Location/loc-${slugify(rec.siteName)}`, display: rec.siteName.trim() },
    effectiveDateTime: new Date(rec.observedAt).toISOString(),
    performer: [{ display: rec.observer.trim() }],
    valueQuantity: { value: rounded, unit: canonical.display, system: 'http://unitsofmeasure.org', code: canonical.ucum },
  };
}

/**
 * Build the export Bundle from approved records only.
 * `timestamp` is injected so tests stay deterministic.
 */
export function buildBundle(approved: RawObservation[], timestamp: string): FhirBundle {
  const locations = new Map<string, FhirLocation>();
  for (const rec of approved) {
    const loc = buildLocation(rec);
    if (!locations.has(loc.id)) locations.set(loc.id, loc);
  }
  const entries: FhirBundle['entry'] = [];
  for (const loc of locations.values()) {
    entries.push({ fullUrl: `urn:uuid:${loc.id}`, resource: loc });
  }
  approved.forEach((rec, i) => {
    const obs = buildObservation(rec, i + 1);
    entries.push({ fullUrl: `urn:uuid:${obs.id}`, resource: obs });
  });
  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp,
    meta: {
      tag: [
        {
          system: 'https://streamproof.dev/tags',
          code: 'draft-ig-prototype',
          display:
            'Prototype output aligned with the OneAquaHealth draft FHIR Implementation Guide (an unauthorised, changeable draft). Not a conformance claim.',
        },
      ],
    },
    entry: entries,
  };
}
