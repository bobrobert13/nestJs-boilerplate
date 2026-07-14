/** API response shape for a persisted scrape result. */
export class ScrapeResultDto {
  id!: string;
  url!: string;
  strategyName!: string;
  status!: string;
  data!: Record<string, unknown> | null;
  errorMessage?: string;
  createdAt!: string;
  updatedAt!: string;
}
