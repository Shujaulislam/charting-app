export interface ColumnFilter {
  readonly column: string;
  readonly value: string;
}

export interface DistinctValue {
  readonly value: string | number | null;
  readonly count: number;
}

export interface LoadingState {
  readonly [key: string]: boolean;
}

export interface DistinctValuesState {
  readonly [key: string]: readonly DistinctValue[];
} 