export interface DataMapping {
  source: string;
  target: string;
}

export interface BaseAdapter<TOutput> {
  adapt(rawData: unknown): TOutput | TOutput[];

  mapFields(
    rawData: Record<string, unknown>,
    mappings: DataMapping[],
  ): Partial<TOutput>;

  readonly name: string;
}
