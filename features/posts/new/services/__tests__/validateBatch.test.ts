import { validateBatch } from '../validateBatch';
import {
  createMockJpegBuffer,
  createMockPngBuffer,
  createMockFile,
} from './fixtures/imageBuffers';

describe('validateBatch', () => {
  it('returns empty valid and rejected arrays when files array is empty', async () => {
    const result = await validateBatch([]);
    expect(result.valid).toEqual([]);
    expect(result.rejected).toEqual([]);
  });

  it('processes all valid files in a batch', async () => {
    const file1 = createMockFile('img1.jpg', createMockJpegBuffer(1200, 1200));
    const file2 = createMockFile('img2.png', createMockPngBuffer(1080, 1080));

    const result = await validateBatch([file1, file2]);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0].name).toBe('img1.jpg');
    expect(result.valid[1].name).toBe('img2.png');
    expect(result.rejected).toHaveLength(0);
  });

  it('separates valid files and rejected files in mixed batches', async () => {
    const validFile1 = createMockFile('good1.jpg', createMockJpegBuffer(1200, 1200));
    const smallFile = createMockFile('small.png', createMockPngBuffer(500, 500)); // <1080px
    const validFile2 = createMockFile('good2.jpg', createMockJpegBuffer(1500, 1500));

    const result = await validateBatch([validFile1, smallFile, validFile2]);

    expect(result.valid).toHaveLength(2);
    expect(result.valid.map((f) => f.name)).toEqual(['good1.jpg', 'good2.jpg']);

    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].file.name).toBe('small.png');
    expect(result.rejected[0].code).toBe('resolution_too_low');
  });

  it('respects AbortSignal cancellation', async () => {
    const controller = new AbortController();
    controller.abort(); // Pre-aborted

    const file = createMockFile('test.jpg', createMockJpegBuffer(1200, 1200));
    const result = await validateBatch([file], 'image', controller.signal);

    expect(result.valid).toEqual([]);
    expect(result.rejected).toEqual([]);
  });
});
