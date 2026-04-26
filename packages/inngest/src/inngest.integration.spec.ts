import { InngestTestEngine } from '@inngest/test';
import { holaInngest } from './functions';

describe('Inngest Integration - HOLA INNGEST Task', () => {
  describe('holaInngest function', () => {
    let testEngine: InngestTestEngine;

    beforeEach(() => {
      testEngine = new InngestTestEngine({
        function: holaInngest,
      });
    });

    it('should process HOLA INNGEST event successfully', async () => {
      const { result } = await testEngine.execute({
        events: [
          {
            name: 'scrapping/hola-inngest',
            data: {
              message: 'HOLA INNGEST',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: 'HOLA INNGEST',
        }),
      );
    });

    it('should process custom message event', async () => {
      const testEngineCustom = new InngestTestEngine({
        function: holaInngest,
      });

      const { result } = await testEngineCustom.execute({
        events: [
          {
            name: 'scrapping/hola-inngest',
            data: {
              message: 'HOLA INNGEST - CUSTOM TEST',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: 'HOLA INNGEST - CUSTOM TEST',
        }),
      );
    });

    it('should execute process-message step', async () => {
      const { step } = await testEngine.executeStep('process-message', {
        events: [
          {
            name: 'scrapping/hola-inngest',
            data: {
              message: 'HOLA INNGEST',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      expect(step.data).toEqual({
        received: 'HOLA INNGEST',
        timestamp: expect.any(String),
      });
    });

    it('should execute log-message step after process-message', async () => {
      const { result } = await testEngine.execute({
        events: [
          {
            name: 'scrapping/hola-inngest',
            data: {
              message: 'HOLA INNGEST',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        steps: [
          {
            id: 'process-message',
            handler: () => ({
              received: 'HOLA INNGEST',
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: 'HOLA INNGEST',
        }),
      );
    });

    it('should handle step failure in process-message', async () => {
      const testEngineWithError = new InngestTestEngine({
        function: holaInngest,
      });

      const { error } = await testEngineWithError.execute({
        events: [
          {
            name: 'scrapping/hola-inngest',
            data: {
              message: 'HOLA INNGEST',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        steps: [
          {
            id: 'process-message',
            handler: () => {
              throw new Error('Step processing failed');
            },
          },
        ],
      });

      expect(error).toBeDefined();
    });

    it('should handle empty message', async () => {
      const { result } = await testEngine.execute({
        events: [
          {
            name: 'scrapping/hola-inngest',
            data: {
              message: '',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: '',
        }),
      );
    });

    it('should handle special characters in message', async () => {
      const specialMessage = 'HOLA INNGEST! 🚀 @#$%';
      const { result } = await testEngine.execute({
        events: [
          {
            name: 'scrapping/hola-inngest',
            data: {
              message: specialMessage,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: specialMessage,
        }),
      );
    });

    it('should have both steps in state', async () => {
      const { state, result } = await testEngine.execute({
        events: [
          {
            name: 'scrapping/hola-inngest',
            data: {
              message: 'HOLA INNGEST',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      expect(state).toBeDefined();
      expect(Object.keys(state).length).toBeGreaterThanOrEqual(2);
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: 'HOLA INNGEST',
        }),
      );
    });
  });
});
