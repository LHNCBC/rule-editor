export interface UneditableVariable {
  name: string;
  type?: string;
  description?: string;
}

export interface Variable {
  _index?: number;  // Original index in extension list
  label: string;
  type: string;
  expression: string;
  simple?: string;
  linkId?: string;
  unit?: string;
  codes?: Array<string>;
  timeInterval?: number;
  timeIntervalUnit?: string;
}

export interface Question {
  linkId: string;
  text: string;
  itemHasScore?: boolean;
  unit?: string;
}

export interface CaseStatement {
  condition: string;
  output: string;
}

export enum AllVariableType {
  question = 'Question',
  expression = 'FHIRPath Expression',
  simple = 'Simple Expression',
  query = 'FHIR Query',
  queryObservation = 'FHIR Query (Observation)'
}

export enum SimpleVariableType {
  question = 'Question',
  simple = 'Simple Expression',
  queryObservation = 'FHIR Query (Observation)'
}

export const CASE_REGEX = /^\s*iif\s*\((.*)\)\s*$/;
