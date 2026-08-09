import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

/* ------------------------------------------------------------------ */
/*  SDK Mock — jest.mock factory MUST be before service import        */
/* ------------------------------------------------------------------ */

const mockZone = {
  _tag: 'StorageZone' as const,
  region: 'de',
  name: 'test-zone',
  accessKey: 'key',
};

jest.mock('@bunny.net/storage-sdk', () => ({
  file: {
    upload: jest.fn().mockResolvedValue(true),
    download: jest.fn().mockResolvedValue({
      stream: {},
      response: {},
      length: 1024,
    }),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    remove: jest.fn().mockResolvedValue(true),
    removeDirectory: jest.fn().mockResolvedValue(true),
  },
  zone: {
    connect_with_accesskey: jest.fn().mockReturnValue({
      _tag: 'StorageZone',
      region: 'de',
      name: 'test-zone',
      accessKey: 'key',
    }),
  },
  regions: {
    StorageRegion: {
      Falkenstein: 'de',
      London: 'uk',
      NewYork: 'ny',
      LosAngeles: 'la',
      Singapore: 'sg',
      Stockholm: 'se',
      SaoPaulo: 'br',
      Johannesburg: 'jh',
      Sydney: 'syd',
    },
  },
}));

const SDK = require('@bunny.net/storage-sdk');
const mockUpload = SDK.file.upload as jest.Mock;
const mockDownload = SDK.file.download as jest.Mock;
const mockList = SDK.file.list as jest.Mock;
const mockGet = SDK.file.get as jest.Mock;
const mockRemove = SDK.file.remove as jest.Mock;
const mockRemoveDirectory = SDK.file.removeDirectory as jest.Mock;
const mockConnect = SDK.zone.connect_with_accesskey as jest.Mock;

import { BunnyStorageService } from './bunny-storage.service';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function createMockConfigService(overrides: Record<string, string> = {}) {
  const defaults: Record<string, string> = {
    storageZoneName: 'test-zone',
    accessKey: 'test-access-key',
    region: 'falkenstein',
    cdnUrl: 'https://cdn.example.com',
  };

  const config = { ...defaults, ...overrides };

  return {
    get: jest.fn((_key: string) => config),
  };
}

function makeStorageFile(overrides: Record<string, unknown> = {}) {
  return {
    _tag: 'StorageFile' as const,
    guid: 'abc-123',
    userId: 'user-1',
    lastChanged: new Date('2025-01-15'),
    dateCreated: new Date('2025-01-10'),
    storageZoneName: 'test-zone',
    path: '/images',
    objectName: 'cover.jpg',
    length: 2048,
    storageZoneId: 42,
    isDirectory: false,
    serverId: 1,
    checksum: 'ABCDEF1234567890',
    replicatedZones: null,
    contentType: 'image/jpeg',
    data: jest.fn(),
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('BunnyStorageService', () => {
  let service: BunnyStorageService;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    configService = createMockConfigService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BunnyStorageService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(BunnyStorageService);
  });

  /* ── constructor ────────────────────────────────────────────── */

  describe('constructor', () => {
    it('connects zone with correct region from config', () => {
      expect(mockConnect).toHaveBeenCalledWith(
        'de',
        'test-zone',
        'test-access-key',
      );
    });

    it('uses falkenstein as default region', async () => {
      jest.clearAllMocks();
      const mod = await Test.createTestingModule({
        providers: [
          BunnyStorageService,
          {
            provide: ConfigService,
            useValue: createMockConfigService({ region: '' }),
          },
        ],
      }).compile();

      mod.get(BunnyStorageService);
      expect(mockConnect).toHaveBeenCalledWith(
        'de',
        'test-zone',
        'test-access-key',
      );
    });

    it('logs warning when BUNNY_STORAGE_ZONE_NAME is empty', async () => {
      jest.clearAllMocks();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mod = await Test.createTestingModule({
        providers: [
          BunnyStorageService,
          {
            provide: ConfigService,
            useValue: createMockConfigService({ storageZoneName: '' }),
          },
        ],
      }).compile();

      const svc = mod.get(BunnyStorageService);
      expect(svc).toBeDefined();
      // Zone should NOT be connected
      expect(mockConnect).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('logs warning when BUNNY_STORAGE_ACCESS_KEY is empty', async () => {
      jest.clearAllMocks();

      const mod = await Test.createTestingModule({
        providers: [
          BunnyStorageService,
          {
            provide: ConfigService,
            useValue: createMockConfigService({ accessKey: '' }),
          },
        ],
      }).compile();

      const svc = mod.get(BunnyStorageService);
      expect(svc).toBeDefined();
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });

  /* ── uploadFile ─────────────────────────────────────────────── */

  describe('uploadFile', () => {
    it('uploads a ReadableStream to the correct path', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });

      const result = await service.uploadFile('/images/cover.jpg', stream);

      expect(result).toBe(true);
      expect(mockUpload).toHaveBeenCalledWith(
        mockZone,
        '/images/cover.jpg',
        stream,
        undefined,
      );
    });

    it('passes contentType option to SDK', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          c.close();
        },
      });

      await service.uploadFile('/doc.pdf', stream, {
        contentType: 'application/pdf',
      });

      expect(mockUpload).toHaveBeenCalledWith(mockZone, '/doc.pdf', stream, {
        contentType: 'application/pdf',
      });
    });

    it('passes sha256Checksum option to SDK', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          c.close();
        },
      });

      await service.uploadFile('/data.bin', stream, {
        sha256Checksum: 'ABCDEF',
      });

      expect(mockUpload).toHaveBeenCalledWith(mockZone, '/data.bin', stream, {
        sha256Checksum: 'ABCDEF',
      });
    });

    it('throws on empty path string', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          c.close();
        },
      });

      await expect(service.uploadFile('', stream)).rejects.toThrow(
        'Storage path must be a non-empty string.',
      );
    });

    it('throws on null/undefined input', async () => {
      await expect(
        service.uploadFile('/file.txt', null as never),
      ).rejects.toThrow('Upload input must not be null or undefined.');
    });

    it('re-throws SDK errors', async () => {
      mockUpload.mockRejectedValueOnce(new Error('Network failure'));

      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          c.close();
        },
      });

      await expect(service.uploadFile('/fail.txt', stream)).rejects.toThrow(
        'Network failure',
      );
    });
  });

  /* ── uploadBuffer ───────────────────────────────────────────── */

  describe('uploadBuffer', () => {
    it('converts Buffer and uploads', async () => {
      const buffer = Buffer.from('hello world');

      await service.uploadBuffer('/text.txt', buffer);

      expect(mockUpload).toHaveBeenCalledTimes(1);
      const [, path, , opts] = mockUpload.mock.calls[0];
      expect(path).toBe('/text.txt');
      expect(opts).toEqual({ contentType: 'application/octet-stream' });
    });

    it('sets contentType when provided', async () => {
      const buffer = Buffer.from('<svg></svg>');

      await service.uploadBuffer('/icon.svg', buffer, 'image/svg+xml');

      const [, , , opts] = mockUpload.mock.calls[0];
      expect(opts).toEqual({ contentType: 'image/svg+xml' });
    });
  });

  /* ── downloadFile ───────────────────────────────────────────── */

  describe('downloadFile', () => {
    it('returns stream and length', async () => {
      const result = await service.downloadFile('/images/photo.jpg');

      expect(result.stream).toBeDefined();
      expect(result.length).toBe(1024);
      expect(mockDownload).toHaveBeenCalledWith(mockZone, '/images/photo.jpg');
    });

    it('throws when file not found', async () => {
      mockDownload.mockRejectedValueOnce(new Error('File not found'));

      await expect(service.downloadFile('/missing.txt')).rejects.toThrow(
        'File not found',
      );
    });

    it('throws on empty path', async () => {
      await expect(service.downloadFile('')).rejects.toThrow(
        'Storage path must be a non-empty string.',
      );
    });
  });

  /* ── listFiles ──────────────────────────────────────────────── */

  describe('listFiles', () => {
    it('lists files in root path "/"', async () => {
      mockList.mockResolvedValueOnce([makeStorageFile()]);

      const files = await service.listFiles('/');

      expect(files).toHaveLength(1);
      expect(files[0].guid).toBe('abc-123');
      expect(files[0].objectName).toBe('cover.jpg');
      expect(mockList).toHaveBeenCalledWith(mockZone, '/');
    });

    it('lists files in subdirectory', async () => {
      mockList.mockResolvedValueOnce([
        makeStorageFile({ path: '/images/covers' }),
      ]);

      const files = await service.listFiles('/images/covers');

      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('/images/covers');
    });

    it('returns empty array when directory is empty', async () => {
      mockList.mockResolvedValueOnce([]);

      const files = await service.listFiles('/empty');

      expect(files).toEqual([]);
    });

    it('maps raw SDK response to BunnyFileInfo[]', async () => {
      mockList.mockResolvedValueOnce([
        makeStorageFile({
          isDirectory: true,
          length: 0,
          objectName: 'thumbs',
        }),
      ]);

      const files = await service.listFiles('/');

      expect(files[0].isDirectory).toBe(true);
      expect(files[0].length).toBe(0);
    });
  });

  /* ── getFileMetadata ────────────────────────────────────────── */

  describe('getFileMetadata', () => {
    it('returns mapped BunnyFileInfo with all fields', async () => {
      mockGet.mockResolvedValueOnce(makeStorageFile());

      const meta = await service.getFileMetadata('/images/cover.jpg');

      expect(meta).toEqual({
        guid: 'abc-123',
        objectName: 'cover.jpg',
        path: '/images',
        length: 2048,
        contentType: 'image/jpeg',
        dateCreated: new Date('2025-01-10'),
        lastChanged: new Date('2025-01-15'),
        isDirectory: false,
        checksum: 'ABCDEF1234567890',
        replicatedZones: null,
      });
    });

    it('maps replicatedZones as array when present', async () => {
      mockGet.mockResolvedValueOnce(
        makeStorageFile({ replicatedZones: ['UK', 'NY'] }),
      );

      const meta = await service.getFileMetadata('/file.txt');
      expect(meta.replicatedZones).toEqual(['UK', 'NY']);
    });

    it('throws when file does not exist', async () => {
      mockGet.mockRejectedValueOnce(new Error('Not found'));

      await expect(service.getFileMetadata('/nope.txt')).rejects.toThrow(
        'Not found',
      );
    });
  });

  /* ── deleteFile ─────────────────────────────────────────────── */

  describe('deleteFile', () => {
    it('calls file.remove with correct path and returns true', async () => {
      const result = await service.deleteFile('/old-file.txt');

      expect(result).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(mockZone, '/old-file.txt');
    });

    it('throws on SDK error', async () => {
      mockRemove.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(service.deleteFile('/protected.txt')).rejects.toThrow(
        'Permission denied',
      );
    });

    it('throws on empty path', async () => {
      await expect(service.deleteFile('')).rejects.toThrow(
        'Storage path must be a non-empty string.',
      );
    });
  });

  /* ── deleteDirectory ────────────────────────────────────────── */

  describe('deleteDirectory', () => {
    it('calls file.removeDirectory with correct path', async () => {
      const result = await service.deleteDirectory('/old-folder');

      expect(result).toBe(true);
      expect(mockRemoveDirectory).toHaveBeenCalledWith(mockZone, '/old-folder');
    });

    it('returns true on success', async () => {
      const result = await service.deleteDirectory('/tmp');
      expect(result).toBe(true);
    });
  });

  /* ── fileExists ─────────────────────────────────────────────── */

  describe('fileExists', () => {
    it('returns true when getFileMetadata succeeds', async () => {
      mockGet.mockResolvedValueOnce(makeStorageFile());

      const exists = await service.fileExists('/images/cover.jpg');

      expect(exists).toBe(true);
    });

    it('returns false when getFileMetadata throws', async () => {
      mockGet.mockRejectedValueOnce(new Error('Not found'));

      const exists = await service.fileExists('/missing.txt');

      expect(exists).toBe(false);
    });
  });

  /* ── getPublicUrl ───────────────────────────────────────────── */

  describe('getPublicUrl', () => {
    it('returns cdnUrl + path when cdnUrl is configured', () => {
      const url = service.getPublicUrl('/images/cover.jpg');
      expect(url).toBe('https://cdn.example.com/images/cover.jpg');
    });

    it('normalizes leading slashes', () => {
      const url = service.getPublicUrl('images/cover.jpg');
      expect(url).toBe('https://cdn.example.com/images/cover.jpg');
    });

    it('strips trailing slash from cdnUrl', async () => {
      jest.clearAllMocks();
      const mod = await Test.createTestingModule({
        providers: [
          BunnyStorageService,
          {
            provide: ConfigService,
            useValue: createMockConfigService({
              cdnUrl: 'https://cdn.example.com/',
            }),
          },
        ],
      }).compile();

      const svc = mod.get(BunnyStorageService);
      const url = svc.getPublicUrl('/file.txt');
      expect(url).toBe('https://cdn.example.com/file.txt');
    });

    it('returns fallback URL pattern when cdnUrl is empty', async () => {
      jest.clearAllMocks();
      const mod = await Test.createTestingModule({
        providers: [
          BunnyStorageService,
          {
            provide: ConfigService,
            useValue: createMockConfigService({ cdnUrl: '' }),
          },
        ],
      }).compile();

      const svc = mod.get(BunnyStorageService);
      const url = svc.getPublicUrl('/images/cover.jpg');
      expect(url).toBe(
        'https://storage.bunnycdn.com/test-zone/images/cover.jpg',
      );
    });
  });

  /* ── zone not connected ─────────────────────────────────────── */

  describe('zone not connected', () => {
    let disconnectedService: BunnyStorageService;

    beforeEach(async () => {
      const mod = await Test.createTestingModule({
        providers: [
          BunnyStorageService,
          {
            provide: ConfigService,
            useValue: createMockConfigService({ storageZoneName: '' }),
          },
        ],
      }).compile();

      disconnectedService = mod.get(BunnyStorageService);
    });

    it('uploadFile throws when zone not connected', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          c.close();
        },
      });

      await expect(
        disconnectedService.uploadFile('/file.txt', stream),
      ).rejects.toThrow('Bunny storage zone is not connected');
    });

    it('downloadFile throws when zone not connected', async () => {
      await expect(
        disconnectedService.downloadFile('/file.txt'),
      ).rejects.toThrow('Bunny storage zone is not connected');
    });

    it('listFiles throws when zone not connected', async () => {
      await expect(disconnectedService.listFiles('/')).rejects.toThrow(
        'Bunny storage zone is not connected',
      );
    });

    it('deleteFile throws when zone not connected', async () => {
      await expect(disconnectedService.deleteFile('/file.txt')).rejects.toThrow(
        'Bunny storage zone is not connected',
      );
    });

    it('deleteDirectory throws when zone not connected', async () => {
      await expect(
        disconnectedService.deleteDirectory('/folder'),
      ).rejects.toThrow('Bunny storage zone is not connected');
    });
  });
});
