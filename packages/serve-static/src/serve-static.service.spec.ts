import { ServeStaticService } from './serve-static.service';

const mockReadFile = jest.fn();
const mockReaddir = jest.fn();

jest.mock('fs', () => ({
  promises: {
    readFile: (...args: any[]) => mockReadFile(...args),
    readdir: (...args: any[]) => mockReaddir(...args),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const mockEjsRender = jest.fn();
jest.mock('ejs', () => ({
  render: (...args: any[]) => mockEjsRender(...args),
}));

describe('ServeStaticService', () => {
  let service: ServeStaticService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServeStaticService();
  });

  describe('render', () => {
    it('renders view with layout and data', async () => {
      mockReadFile
        .mockResolvedValueOnce('<h1><%= title %></h1>')
        .mockResolvedValueOnce('<html><body><%- body %></body></html>');
      mockEjsRender
        .mockReturnValueOnce('<h1>Home</h1>')
        .mockReturnValueOnce('<html><body><h1>Home</h1></body></html>');

      const result = await service.render('home', { title: 'Home' });

      expect(result).toBe('<html><body><h1>Home</h1></body></html>');
      expect(mockEjsRender).toHaveBeenCalledTimes(2);
    });

    it('throws for invalid view name with path traversal', async () => {
      await expect(service.render('../etc/passwd')).rejects.toThrow(
        /Invalid view name/,
      );
    });

    it('throws for view name with special characters', async () => {
      await expect(service.render('home.ejs')).rejects.toThrow(
        /Invalid view name/,
      );
    });

    it('throws when view file not found', async () => {
      const enoent = new Error('ENOENT') as any;
      enoent.code = 'ENOENT';
      mockReadFile.mockRejectedValue(enoent);

      await expect(service.render('nonexistent')).rejects.toThrow(
        /View not found: nonexistent/,
      );
    });

    it('uses default layout when none specified', async () => {
      mockReadFile
        .mockResolvedValueOnce('<p>content</p>')
        .mockResolvedValueOnce('<html><%- body %></html>');
      mockEjsRender
        .mockReturnValueOnce('<p>content</p>')
        .mockReturnValueOnce('<html><p>content</p></html>');

      await service.render('page');

      const calls = mockReadFile.mock.calls;
      expect(calls[1][0]).toContain('main');
    });
  });

  describe('renderString', () => {
    it('renders inline template with data', async () => {
      mockEjsRender.mockReturnValue('<p>Hello World</p>');

      const result = await service.renderString('<p><%= msg %></p>', {
        msg: 'Hello World',
      });

      expect(result).toBe('<p>Hello World</p>');
      expect(mockEjsRender).toHaveBeenCalledWith(
        '<p><%= msg %></p>',
        expect.objectContaining({ msg: 'Hello World' }),
        expect.any(Object),
      );
    });
  });

  describe('getPartials', () => {
    it('returns list of partial names', async () => {
      mockReaddir.mockResolvedValue(['header.ejs', 'footer.ejs', 'readme.md']);

      const result = await service.getPartials();

      expect(result).toEqual(['header', 'footer']);
    });

    it('returns empty array when directory does not exist', async () => {
      mockReaddir.mockRejectedValue(new Error('ENOENT'));

      const result = await service.getPartials();

      expect(result).toEqual([]);
    });
  });

  describe('getPages', () => {
    it('returns list of page names', async () => {
      mockReaddir.mockResolvedValue(['home.ejs', 'about.ejs']);

      const result = await service.getPages();

      expect(result).toEqual(['home', 'about']);
    });
  });

  describe('clearTemplateCache', () => {
    it('clears cached templates forcing re-read', async () => {
      mockReadFile.mockResolvedValue('<p>cached</p>');
      mockEjsRender.mockReturnValue('<p>cached</p>');

      await service.render('page1');
      service.clearTemplateCache();
      await service.render('page1');

      // 2 readFile calls per render (view + layout) = 4 total
      expect(mockReadFile).toHaveBeenCalledTimes(4);
    });
  });

  describe('getAssetsPath', () => {
    it('returns path to assets directory', () => {
      const result = service.getAssetsPath();
      expect(result).toContain('assets');
    });
  });
});
