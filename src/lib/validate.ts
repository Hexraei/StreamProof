import type { RawObservation, ValidationIssue, Parameter } from './types';
import { canonicalUnit } from './units';

/**
 * Plausibility ranges for urban freshwater streams.
 * 'error'  = physically impossible or clearly broken entry; blocks approval.
 * 'warn'   = possible but unusual for a stream; a human reviewer must see it.
 */
const RANGES: Record<Parameter, { hardMin: number; hardMax: number; warnMin: number; warnMax: number; label: string }> = {
  ph: { hardMin: 0, hardMax: 14, warnMin: 4.5, warnMax: 9.5, label: 'pH' },
  water_temperature: { hardMin: -5, hardMax: 60, warnMin: 0, warnMax: 35, label: '°C' },
  conductivity: { hardMin: 0, hardMax: 100000, warnMin: 0, warnMax: 2000, label: 'µS/cm' },
};

export function isValidDate(s: string): boolean {
  if (!s || !s.trim()) return false;
  const t = Date.parse(s);
  return !Number.isNaN(t);
}

/** Same site, same parameter, same minute = the same measurement typed twice. */
export function isDuplicate(a: RawObservation, b: RawObservation): boolean {
  if (a.id === b.id) return false;
  if (a.parameter !== b.parameter) return false;
  if (a.siteName.trim().toLowerCase() !== b.siteName.trim().toLowerCase()) return false;
  const ta = Date.parse(a.observedAt);
  const tb = Date.parse(b.observedAt);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return Math.abs(ta - tb) < 60_000;
}

/** Deterministic checks on one record, plus duplicate checks against its peers. */
export function validateObservation(
  rec: RawObservation,
  all: RawObservation[] = [],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!rec.siteName.trim()) {
    issues.push({ code: 'missing-field', severity: 'error', field: 'siteName', message: 'No site name. Every record must say where the water was measured.' });
  }
  if (!isValidDate(rec.observedAt)) {
    issues.push({ code: 'invalid-date', severity: 'error', field: 'observedAt', message: 'Missing or unreadable date/time of measurement.' });
  }
  if (rec.value === null || Number.isNaN(rec.value)) {
    issues.push({ code: 'non-numeric-value', severity: 'error', field: 'value', message: 'No numeric value recorded.' });
  }
  if (!rec.unit.trim() && rec.parameter !== 'ph') {
    issues.push({ code: 'missing-unit', severity: 'error', field: 'unit', message: 'No unit given. A number without a unit is not a measurement.' });
  }
  if (!rec.observer.trim()) {
    issues.push({ code: 'missing-field', severity: 'error', field: 'observer', message: 'No observer named. Standards records must say who measured.' });
  }

  if (rec.basis === 'photo-only') {
    issues.push({
      code: 'photo-only-claim',
      severity: 'error',
      field: 'basis',
      message: 'This is a claim from a photo, not a measurement. StreamProof will not turn a guess from a picture into a standards record.',
    });
  }

  const canonical = canonicalUnit(rec.parameter, rec.unit);
  if (rec.unit.trim() && !canonical) {
    issues.push({ code: 'unknown-unit', severity: 'error', field: 'unit', message: `Unit "${rec.unit}" is not recognised for this parameter.` });
  }

  if (rec.value !== null && !Number.isNaN(rec.value) && canonical) {
    const v = canonical.toCanonical(rec.value);
    const r = RANGES[rec.parameter];
    if (v < r.hardMin || v > r.hardMax) {
      issues.push({
        code: 'implausible-value',
        severity: 'error',
        field: 'value',
        message: `${v.toFixed(2)} ${r.label} is outside any plausible range for stream water (${r.hardMin}-${r.hardMax}). Likely a typo or a broken sensor.`,
      });
    } else if (v < r.warnMin || v > r.warnMax) {
      issues.push({
        code: 'atypical-value',
        severity: 'warning',
        field: 'value',
        message: `${v.toFixed(2)} ${r.label} is unusual for a stream (typical ${r.warnMin}-${r.warnMax}). A reviewer should confirm it.`,
      });
    }
  }

  if (all.some((other) => isDuplicate(rec, other))) {
    issues.push({
      code: 'duplicate',
      severity: 'warning',
      message: 'Looks like a duplicate: same site, same parameter, same minute as another record.',
    });
  }

  return issues;
}

/** A record may be approved only when it has no errors (warnings are allowed but shown). */
export function canApprove(issues: ValidationIssue[]): boolean {
  return !issues.some((i) => i.severity === 'error');
}
