import { DocumentProcessorService } from './document-processor.service';
import { PdfService } from './pdf.service';
import { DocxService } from './docx.service';

describe('DocumentProcessorService', () => {
  let service: DocumentProcessorService;
  let mockPdfService: jest.Mocked<PdfService>;
  let mockDocxService: jest.Mocked<DocxService>;

  beforeEach(() => {
    mockPdfService = {
      parse: jest.fn(),
      supports: jest.fn((format: string) => format === 'pdf'),
    } as any;

    mockDocxService = {
      parse: jest.fn(),
      supports: jest.fn(
        (format: string) => format === 'docx' || format === 'doc',
      ),
    } as any;

    service = new DocumentProcessorService(mockPdfService, mockDocxService);
  });

  describe('extract', () => {
    it('extracts text from PDF buffer', async () => {
      const buffer = Buffer.from('fake pdf content');
      mockPdfService.parse.mockResolvedValue({
        text: 'Hello PDF',
        pageCount: 3,
        format: 'pdf',
      });

      const result = await service.extract(buffer, 'pdf');

      expect(result.text).toBe('Hello PDF');
      expect(result.pageCount).toBe(3);
      expect(result.format).toBe('pdf');
      expect(mockPdfService.parse).toHaveBeenCalledWith(buffer);
    });

    it('extracts text from DOCX buffer', async () => {
      const buffer = Buffer.from('fake docx content');
      mockDocxService.parse.mockResolvedValue({
        text: 'Hello DOCX',
        format: 'docx',
      });

      const result = await service.extract(buffer, 'docx');

      expect(result.text).toBe('Hello DOCX');
      expect(result.pageCount).toBe(1); // default when not provided
      expect(result.format).toBe('docx');
    });

    it('throws error for unsupported format', async () => {
      const buffer = Buffer.from('data');

      await expect(service.extract(buffer, 'xlsx')).rejects.toThrow(
        /Unsupported document format: xlsx/,
      );
    });

    it('wraps parser errors with DOCUMENT_PARSE_ERROR code', async () => {
      const buffer = Buffer.from('corrupt');
      mockPdfService.parse.mockRejectedValue(new Error('Corrupt PDF'));

      await expect(service.extract(buffer, 'pdf')).rejects.toThrow(
        /DOCUMENT_PARSE_ERROR/,
      );
    });

    it('defaults pageCount to 1 when parser does not provide it', async () => {
      const buffer = Buffer.from('docx data');
      mockDocxService.parse.mockResolvedValue({
        text: 'No page count',
        format: 'docx',
      });

      const result = await service.extract(buffer, 'docx');

      expect(result.pageCount).toBe(1);
    });

    it('passes images array from parser result', async () => {
      const buffer = Buffer.from('pdf with images');
      mockPdfService.parse.mockResolvedValue({
        text: 'Text with images',
        pageCount: 2,
        images: ['img1.png', 'img2.png'],
        format: 'pdf',
      });

      const result = await service.extract(buffer, 'pdf');

      expect(result.images).toEqual(['img1.png', 'img2.png']);
    });
  });
});
