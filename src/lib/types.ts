export type Parameter = 'ph' | 'water_temperature' | 'conductivity';

export type SourceKind = 'manual' | 'csv' | 'reference-sample' | 'synthetic-sample';

/** How the value was obtained. Only 'measured' records can become standards records. */
export type Basis = 'measured' | 'photo-only' | 'estimated';

export interface RawObservation {
  id: string;
  source: SourceKind;
  siteName: string;
  observedAt: string; // ISO date or datetime, as entered
  parameter: Parameter;
  value: number | null;
  unit: string; // as entered
  observer: string;
  notes?: string;
  basis: Basis;
  latitude?: number | null;
  longitude?: number | null;
}

export type IssueCode =
  | 'missing-field'
  | 'invalid-date'
  | 'non-numeric-value'
  | 'missing-unit'
  | 'unknown-unit'
  | 'implausible-value'
  | 'atypical-value'
  | 'duplicate'
  | 'photo-only-claim';

export interface ValidationIssue {
  code: IssueCode;
  severity: 'error' | 'warning';
  field?: string;
  message: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewedObservation extends RawObservation {
  status: ReviewStatus;
  issues: ValidationIssue[];
}

export const PARAMETER_LABELS: Record<Parameter, string> = {
  ph: 'pH',
  water_temperature: 'Water temperature',
  conductivity: 'Conductivity',
};
