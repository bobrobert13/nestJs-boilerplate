import { NewsletterService } from './newsletter.service';
import { ResendService } from '../../services/resend.service';

describe('NewsletterService', () => {
  let service: NewsletterService;
  let mockSubscriberModel: any;
  let mockResendService: jest.Mocked<ResendService>;

  beforeEach(() => {
    mockSubscriberModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockResendService = {
      sendEmail: jest.fn().mockResolvedValue({ id: 'email-1' }),
    } as any;

    service = new NewsletterService(mockSubscriberModel, mockResendService);
  });

  describe('subscribe', () => {
    it('creates a new subscriber with confirmation token', async () => {
      mockSubscriberModel.findOne.mockResolvedValue(null);
      mockSubscriberModel.create.mockResolvedValue({
        email: 'new@example.com',
        isActive: false,
        confirmationToken: 'hashed',
      });

      const result = await service.subscribe({ email: 'new@example.com' });

      expect(result.email).toBe('new@example.com');
      expect(mockSubscriberModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          isActive: false,
        }),
      );
      expect(mockResendService.sendEmail).toHaveBeenCalled();
    });

    it('resets confirmation for existing subscriber', async () => {
      const existing = {
        email: 'existing@example.com',
        isActive: true,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockSubscriberModel.findOne.mockResolvedValue(existing);

      await service.subscribe({ email: 'existing@example.com' });

      expect(existing.isActive).toBe(false);
      expect(existing.save).toHaveBeenCalled();
      expect(mockResendService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('confirms subscription with valid token', async () => {
      const subscriber = {
        isActive: false,
        confirmationExpiresAt: new Date(Date.now() + 100000),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockSubscriberModel.findOne.mockResolvedValue(subscriber);

      const result = await service.confirm('valid-raw-token');

      expect(result.ok).toBe(true);
      expect(result.message).toBe('Subscription confirmed');
      expect(subscriber.isActive).toBe(true);
    });

    it('rejects invalid token', async () => {
      mockSubscriberModel.findOne.mockResolvedValue(null);

      const result = await service.confirm('invalid-token');

      expect(result.ok).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('rejects expired token', async () => {
      const subscriber = {
        isActive: false,
        confirmationExpiresAt: new Date(Date.now() - 100000),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockSubscriberModel.findOne.mockResolvedValue(subscriber);

      const result = await service.confirm('expired-token');

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Token expired');
    });
  });

  describe('unsubscribe', () => {
    it('deactivates subscriber', async () => {
      const subscriber = {
        email: 'user@example.com',
        isActive: true,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockSubscriberModel.findOne.mockResolvedValue(subscriber);

      await service.unsubscribe({ email: 'user@example.com' });

      expect(subscriber.isActive).toBe(false);
      expect(subscriber.save).toHaveBeenCalled();
    });

    it('does nothing for unknown email', async () => {
      mockSubscriberModel.findOne.mockResolvedValue(null);

      await expect(
        service.unsubscribe({ email: 'unknown@example.com' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('getSubscribers', () => {
    it('returns active subscribers by default', async () => {
      mockSubscriberModel.find.mockResolvedValue([{ email: 'a@example.com' }]);

      const result = await service.getSubscribers();

      expect(mockSubscriberModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(result).toHaveLength(1);
    });

    it('returns all subscribers when onlyActive is false', async () => {
      mockSubscriberModel.find.mockResolvedValue([]);

      await service.getSubscribers(false);

      expect(mockSubscriberModel.find).toHaveBeenCalledWith({});
    });
  });

  describe('getSubscriberCount', () => {
    it('returns count of active subscribers', async () => {
      mockSubscriberModel.countDocuments.mockResolvedValue(42);

      const result = await service.getSubscriberCount();

      expect(result).toBe(42);
      expect(mockSubscriberModel.countDocuments).toHaveBeenCalledWith({
        isActive: true,
      });
    });
  });

  describe('sendNewsletter', () => {
    it('sends to all active subscribers', async () => {
      mockSubscriberModel.find.mockResolvedValue([
        { email: 'a@example.com' },
        { email: 'b@example.com' },
      ]);

      const result = await service.sendNewsletter('Subject', '<p>Content</p>');

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockResendService.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('counts failures without blocking other sends', async () => {
      mockSubscriberModel.find.mockResolvedValue([
        { email: 'ok@example.com' },
        { email: 'fail@example.com' },
      ]);
      mockResendService.sendEmail
        .mockResolvedValueOnce({ id: 'e1' })
        .mockRejectedValueOnce(new Error('SMTP error'));

      const result = await service.sendNewsletter('Subject', 'Content');

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
    });
  });
});
