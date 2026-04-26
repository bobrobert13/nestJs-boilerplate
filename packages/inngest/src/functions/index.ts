import { Inngest } from 'inngest';

const inngest = new Inngest({ id: 'nominas' });

export const scrappingJobMonitor = inngest.createFunction(
  {
    id: 'scrapping-job-monitor',
    name: 'Scrapping Job Monitor',
    triggers: [{ event: 'scrapping/job.started' }],
  },
  async ({ event, step }) => {
    await step.run('log-job-start', async () => {
      console.log(`[Scrapping Monitor] Job started: ${event.data.jobId}`);
      console.log(`[Scrapping Monitor] Strategy: ${event.data.strategyName}`);
    });

    await step.sleep('wait-for-completion', '1h');

    await step.run('check-job-status', async () => {
      console.log(
        `[Scrapping Monitor] Checking status for job: ${event.data.jobId}`,
      );
    });
  },
);

export const scrappingCompletionHandler = inngest.createFunction(
  {
    id: 'scrapping-completion-handler',
    name: 'Scrapping Completion Handler',
    triggers: [{ event: 'scrapping/job.completed' }],
  },
  async ({ event, step }) => {
    const stats = await step.run('process-completion-stats', async () => {
      return {
        jobId: event.data.jobId,
        resultCount: event.data.resultCount ?? 0,
        completedAt: event.data.timestamp,
      };
    });

    if (stats.resultCount > 0) {
      await step.run('notify-success', async () => {
        console.log(
          `[Completion Handler] Job ${stats.jobId} completed with ${stats.resultCount} results`,
        );
      });
    }

    return stats;
  },
);

export const scrappingFailureHandler = inngest.createFunction(
  {
    id: 'scrapping-failure-handler',
    name: 'Scrapping Failure Handler',
    triggers: [{ event: 'scrapping/job.failed' }],
  },
  async ({ event, step }) => {
    await step.run('log-failure', async () => {
      console.error(
        `[Failure Handler] Job ${event.data.jobId} failed: ${event.data.error}`,
      );
    });

    await step.run('alert-team', async () => {
      console.log('[Failure Handler] Alerting team about failure');
    });
  },
);

export const dailyScrappingReport = inngest.createFunction(
  {
    id: 'daily-scrapping-report',
    name: 'Daily Scrapping Report',
    triggers: [{ cron: '0 9 * * *' }],
  },
  async ({ step }) => {
    const report = await step.run('generate-daily-report', async () => {
      return {
        date: new Date().toISOString(),
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
      };
    });

    await step.run('send-report', async () => {
      console.log('[Daily Report] Sending report:', report);
    });

    return report;
  },
);

export const holaInngest = inngest.createFunction(
  {
    id: 'hola-inngest-function',
    name: 'Hola Inngest',
    triggers: [{ event: 'scrapping/hola-inngest' }],
  },
  async ({ event, step }) => {
    const message = await step.run('process-message', async () => {
      return {
        received: event.data.message,
        timestamp: event.data.timestamp,
      };
    });

    await step.run('log-message', async () => {
      console.log(`[HOLA INNGEST] ${message.received}`);
    });

    return {
      success: true,
      message: message.received,
    };
  },
);

export const functions = [
  scrappingJobMonitor,
  scrappingCompletionHandler,
  scrappingFailureHandler,
  dailyScrappingReport,
  holaInngest,
];
