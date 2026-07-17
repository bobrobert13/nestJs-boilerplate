import { registerAs } from '@nestjs/config';

export interface PlaywrightConfig {
  headless: boolean;
  timeout: number;
  retries: number;
  browsersPath?: string;
}

export default registerAs(
  'playwright',
  (): PlaywrightConfig => ({
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.PLAYWRIGHT_RETRIES || '3', 10),
    browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || undefined,
  }),
);
