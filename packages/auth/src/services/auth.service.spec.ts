import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../strategies/auth.controller';
import { AuthService } from './auth.service';
import { MagicLinkService } from './magic-link.service';
import { ResendService } from '@common/resend';

describe('AuthController — magic-link delivery (C3)', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockMagicLink: any;
  let mockResend: any;

  async function buildController() {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MagicLinkService, useValue: mockMagicLink },
        { provide: ResendService, useValue: mockResend },
      ],
    }).compile();
    return module.get(AuthController);
  }

  beforeEach(() => {
    mockAuthService = { validateUser: jest.fn(), login: jest.fn() } as any;
    mockMagicLink = {
      isEnabled: jest.fn(),
      generateMagicLink: jest.fn(),
      getConfig: jest.fn(),
      invalidateToken: jest.fn(),
    };
    mockResend = { sendMagicLink: jest.fn() };
  });

  it('returns HTTP 200 with a generic magic-link message and no token in body', async () => {
    mockMagicLink.isEnabled.mockReturnValue(true);
    mockMagicLink.generateMagicLink.mockResolvedValue('TOKEN-SHOULD-NOT-LEAK');
    mockMagicLink.getConfig.mockReturnValue({ enabled: true, tokenTtl: 300 });
    mockResend.sendMagicLink.mockResolvedValue({ id: 'email-1', to: [], from: '', subject: '', createdAt: new Date() } as any);

    const controller = await buildController();
    const result = await controller.requestMagicLink({ email: 'a@b.com' });

    expect(result.success).toBe(true);
    expect(JSON.stringify(result)).not.toContain('TOKEN-SHOULD-NOT-LEAK');
    expect((result.data as any).message).toMatch(/magic link/i);
  });

  it('sends the generated magic-link token through Resend', async () => {
    mockMagicLink.isEnabled.mockReturnValue(true);
    mockMagicLink.generateMagicLink.mockResolvedValue('the-real-token');
    mockMagicLink.getConfig.mockReturnValue({ enabled: true, tokenTtl: 300 });
    mockResend.sendMagicLink.mockResolvedValue({ id: 'x', to: [], from: '', subject: '', createdAt: new Date() } as any);

    const controller = await buildController();
    await controller.requestMagicLink({ email: 'a@b.com' });

    expect(mockResend.sendMagicLink).toHaveBeenCalledWith('a@b.com', 'the-real-token', 300);
  });

  it('returns HTTP 503 when Resend delivery is unavailable without exposing a token', async () => {
    mockMagicLink.isEnabled.mockReturnValue(true);
    mockMagicLink.generateMagicLink.mockResolvedValue('must-not-leak');
    mockMagicLink.getConfig.mockReturnValue({ enabled: true, tokenTtl: 300 });
    mockMagicLink.invalidateToken.mockResolvedValue();
    mockResend.sendMagicLink.mockRejectedValue(new Error('Resend API down'));

    const controller = await buildController();
    let caught: any;
    try {
      await controller.requestMagicLink({ email: 'a@b.com' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.getStatus?.() ?? caught?.status).toBe(503);
    expect(JSON.stringify(caught?.getResponse?.() ?? caught?.response ?? {})).not.toContain('must-not-leak');
    expect(mockMagicLink.invalidateToken).toHaveBeenCalledWith('must-not-leak');
  });
});

describe('AuthController — login (M6)', () => {
  function buildController() {
    const mockAuthService: any = {
      validateUser: jest.fn(),
      login: jest.fn(),
    };
    const mockMagicLink: any = { isEnabled: jest.fn() };
    const mockResend: any = { sendMagicLink: jest.fn() };

    return Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MagicLinkService, useValue: mockMagicLink },
        { provide: ResendService, useValue: mockResend },
      ],
    })
      .compile()
      .then((m) => ({
        controller: m.get(AuthController),
        mockAuthService,
      }));
  }

  it('returns HTTP 401 instead of 200 success:false for invalid credentials', async () => {
    const { controller, mockAuthService } = await buildController();
    mockAuthService.validateUser.mockResolvedValue(null);

    let caught: any;
    try {
      await controller.login({ email: 'bad@example.com', password: 'wrong' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(UnauthorizedException);
    expect(caught.getStatus()).toBe(401);
  });

  it('returns the normal success payload for valid credentials', async () => {
    const { controller, mockAuthService } = await buildController();
    mockAuthService.validateUser.mockResolvedValue({
      id: 'u-1',
      email: 'good@example.com',
      roles: ['user'],
    });
    mockAuthService.login.mockResolvedValue({
      accessToken: 'A',
      refreshToken: 'R',
      expiresIn: 900,
    });

    const result = await controller.login({
      email: 'good@example.com',
      password: 'right',
    });
    expect(result.success).toBe(true);
    expect((result.data as any).accessToken).toBe('A');
  });
});