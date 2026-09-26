import type { Parameter } from './types';

export interface CanonicalUnit {
  /** UCUM code used in the FHIR valueQuantity. */
  ucum: string;
  /** Human-readable unit label. */
  display: string;
  /** Convert an entered value into the canonical unit. */
  toCanonical: (value: number) => number;
}

const identity = (v: number) => v;
const fToC = (v: number) => ((v - 32) * 5) / 9;
const mSToUS = (v: number) => v * 1000;

const norm = (unit: string) =>
  unit.trim().toLowerCase().replace(/μ/g, 'µ').replace(/\s+/g, '');

/**
 * Map a unit as typed by a citizen (messy, varied) onto one canonical unit per
 * parameter. Returns null when the unit is not recognised - the record then
 * gets an 'unknown-unit' error and cannot be approved.
 */
export function canonicalUnit(parameter: Parameter, unit: string): CanonicalUnit | null {
  const u = norm(unit);
  switch (parameter) {
    case 'ph':
      if (['ph', '{ph}', 'phunits', 'units', 'unitless', ''].includes(u)) {
        return { ucum: '{pH}', display: 'pH', toCanonical: identity };
      }
      return null;
    case 'water_temperature':
      if (['c', '°c', 'cel', 'celsius', 'degc'].includes(u)) {
        return { ucum: 'Cel', display: '°C', toCanonical: identity };
      }
      if (['f', '°f', 'fahrenheit', 'degf'].includes(u)) {
        return { ucum: 'Cel', display: '°C', toCanonical: fToC };
      }
      return null;
    case 'conductivity':
      if (['µs/cm', 'us/cm', 'µs·cm-1', 'µscm-1', 'microsiemens/cm'].includes(u)) {
        return { ucum: 'uS/cm', display: 'µS/cm', toCanonical: identity };
      }
      if (['ms/cm', 'ms·cm-1', 'mscm-1', 'millisiemens/cm'].includes(u)) {
        return { ucum: 'uS/cm', display: 'µS/cm', toCanonical: mSToUS };
      }
      return null;
  }
}
