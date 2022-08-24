import type { SyntaxError, ValidationIssue } from '@superfaceai/parser';

export type ReportKind = 'file' | 'compatibility';

export interface Report {
  kind: ReportKind;
  path: string;
}

export interface FileReport extends Report {
  kind: 'file';
  errors: (SyntaxError | ValidationIssue)[];
  warnings: ValidationIssue[];
}

export interface ProfileMapReport extends Report {
  kind: 'compatibility';
  profile: string;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export type ReportFormat = FileReport | ProfileMapReport;
