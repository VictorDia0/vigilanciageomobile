/** Par valor/rótulo retornado pelos Resources do Laravel. */
export interface StatusValor {
  value: string;
  label: string;
}

export interface LabeledField<T extends string = string> {
  value: T;
  label: string;
}
