import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResendService } from './resend.service';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

describe('ResendService', () => {
  let service: ResendService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockResendClient: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue({
        apiKey: 're_test_key',
        fromEmail: 'test@example.com',
        fromName: 'Test App',
        replyTo: 'reply@example.com',
      }),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        ResendService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(ResendService);
    mockResendClient = (service as any).client;
  });

  describe('sendEmail', () => {
    it('sends email with correct payload', async () => {
      mockResendClient.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
      });

      const result = await service.sendEmail({
        to: 'user@example.com',
        subject: 'Hello',
        text: 'World',
      });

      expect(result.id).toBe('email-123');
      expect(result.to).toEqual(['user@example.com']);
      expect(result.from).toBe('Test App <test@example.com>');
      expect(result.subject).toBe('Hello');
      expect(mockResendClient.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user@example.com'],
          subject: 'Hello',
          text: 'World',
        }),
      );
    });

    it('sends to multiple recipients', async () => {
      mockResendClient.emails.send.mockResolvedValue({ data: { id: 'e1' } });

      const result = await service.sendEmail({
        to: ['a@example.com', 'b@example.com'],
        subject: 'Multi',
        html: '<p>Hi</p>',
      });

      expect(result.to).toEqual(['a@example.com', 'b@example.com']);
    });

    it('uses custom from when provided', async () => {
      mockResendClient.emails.send.mockResolvedValue({ data: { id: 'e2' } });

      await service.sendEmail({
        to: 'user@example.com',
        subject: 'Custom',
        text: 'body',
        from: 'Custom <custom@example.com>',
      });

      expect(mockResendClient.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'Custom <custom@example.com>' }),
      );
    });

    it('includes replyTo from config when not overridden', async () => {
      mockResendClient.emails.send.mockResolvedValue({ data: { id: 'e3' } });

      await service.sendEmail({
        to: 'user@example.com',
        subject: 'Reply',
        text: 'body',
      });

      expect(mockResendClient.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({ reply_to: 'reply@example.com' }),
      );
    });

    it('throws on send failure', async () => {
      mockResendClient.emails.send.mockRejectedValue(new Error('API error'));

      await expect(
        service.sendEmail({
          to: 'user@example.com',
          subject: 'Fail',
          text: 'x',
        }),
      ).rejects.toThrow('API error');
    });
  });

  describe('sendEmailWithTemplate', () => {
    it('renders template with data', async () => {
      mockResendClient.emails.send.mockResolvedValue({ data: { id: 'e4' } });

      await service.sendEmailWithTemplate(
        'user@example.com',
        'Welcome {{name}} to {{app}}',
        { name: 'Alice', app: 'MyApp' },
      );

      expect(mockResendClient.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: 'Welcome Alice to MyApp',
        }),
      );
    });
  });

  describe('sendMagicLink', () => {
    it('sends magic link email with token in URL', async () => {
      mockResendClient.emails.send.mockResolvedValue({ data: { id: 'e5' } });

      await service.sendMagicLink('user@example.com', 'abc123token', 300);

      expect(mockResendClient.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user@example.com'],
          subject: 'Your magic link',
        }),
      );
      const callArgs = mockResendClient.emails.send.mock.calls[0][0];
      expect(callArgs.html).toContain('abc123token');
      expect(callArgs.html).toContain('5 minutes');
    });
  });
});
