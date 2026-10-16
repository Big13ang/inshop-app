import { Result } from '@/lib/utils/result';
import { compressImage } from '../compressImage';
import { compressInWorker, isCompressionSupported } from '../compressionPool';

// Factory mock: the real pool uses import.meta, which Jest cannot load.
const mockLogInfo = jest.fn();
jest.mock('@/lib/telemetry/logger', () => ({
    logger: { forDomain: () => ({ info: (...args: unknown[]) => mockLogInfo(...args) }) },
}));

jest.mock('../compressionPool', () => ({
    isCompressionSupported: jest.fn(),
    compressInWorker: jest.fn(),
}));

const mockSupported = isCompressionSupported as jest.MockedFunction<typeof isCompressionSupported>;
const mockCompress = compressInWorker as jest.MockedFunction<typeof compressInWorker>;

const makeFile = (size: number, name = 'photo.final.jpg') =>
    new File([new Uint8Array(size)], name, { type: 'image/jpeg' });

const success = (bytes: number) => Result.ok(new ArrayBuffer(bytes));

describe('compressImage', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockSupported.mockReturnValue(true);
    });

    it('returns the original when unsupported, without touching the pool', async () => {
        mockSupported.mockReturnValue(false);
        const file = makeFile(5000);
        await expect(compressImage(file)).resolves.toBe(file);
        expect(mockCompress).not.toHaveBeenCalled();
    });

    it('returns the original when the worker reports an error', async () => {
        mockCompress.mockResolvedValue(Result.err('boom'));
        const file = makeFile(5000);
        await expect(compressImage(file)).resolves.toBe(file);
    });

    it('re-checks support per call and skips the pool once it reports unsupported', async () => {
        mockSupported.mockReturnValueOnce(true).mockReturnValue(false);
        mockCompress.mockResolvedValue(Result.err('timeout'));
        const first = makeFile(5000);
        await expect(compressImage(first)).resolves.toBe(first);
        expect(mockCompress).toHaveBeenCalledTimes(1);

        const second = makeFile(5000);
        await expect(compressImage(second)).resolves.toBe(second);
        expect(mockCompress).toHaveBeenCalledTimes(1);
    });

    it('returns the original when the output is not smaller', async () => {
        mockCompress.mockResolvedValue(success(5000));
        const file = makeFile(5000);
        await expect(compressImage(file)).resolves.toBe(file);
    });

    it('returns a webp file named after the original basename on success', async () => {
        mockCompress.mockResolvedValue(success(1000));
        const result = await compressImage(makeFile(5000));
        expect(result.name).toBe('photo.final.webp');
        expect(result.type).toBe('image/webp');
        expect(result.size).toBe(1000);
    });

    it('keeps lastModified from the source file', async () => {
        mockCompress.mockResolvedValue(success(1000));
        const source = new File([new Uint8Array(5000)], 'a.jpg', {
            type: 'image/jpeg',
            lastModified: 1_700_000_000_000,
        });
        const result = await compressImage(source);
        expect(result.lastModified).toBe(1_700_000_000_000);
    });

    it('treats an output exactly 1 byte smaller as compressed', async () => {
        mockCompress.mockResolvedValue(success(4999));
        const result = await compressImage(makeFile(5000));
        expect(result.type).toBe('image/webp');
        expect(result.size).toBe(4999);
    });

    it('resolves to the original when compressInWorker rejects', async () => {
        mockCompress.mockRejectedValue(new Error('pool exploded'));
        const file = makeFile(5000);
        await expect(compressImage(file)).resolves.toBe(file);
    });

    it('resolves to the original when compressInWorker throws synchronously', async () => {
        mockCompress.mockImplementation(() => {
            throw new Error('sync boom');
        });
        const file = makeFile(5000);
        await expect(compressImage(file)).resolves.toBe(file);
    });

    it.each([
        ['a.b.JPG', 'a.b.webp'],
        ['.hidden', '.hidden.webp'],
        ['noext', 'noext.webp'],
        ['photo.jpeg', 'photo.webp'],
    ])('names %s as %s', async (input, expected) => {
        mockCompress.mockResolvedValue(success(10));
        const result = await compressImage(makeFile(5000, input));
        expect(result.name).toBe(expected);
    });
});

describe('compressImage logging', () => {
    const NAME = 'secret-passport-scan.jpg';

    beforeEach(() => {
        jest.resetAllMocks();
        mockSupported.mockReturnValue(true);
    });

    it.each([
        ['unsupported', () => mockSupported.mockReturnValue(false), undefined],
        ['worker_error', () => mockCompress.mockResolvedValue(Result.err('boom')), undefined],
        ['no_gain', () => mockCompress.mockResolvedValue(success(5000)), 5000],
        ['compressed', () => mockCompress.mockResolvedValue(success(1000)), 1000],
    ])('logs one structured upload entry for %s without the file name', async (outcome, arrange, outputBytes) => {
        arrange();
        await compressImage(makeFile(5000, NAME));

        expect(mockLogInfo).toHaveBeenCalledTimes(1);
        const [, context] = mockLogInfo.mock.calls[0];
        expect(context).toMatchObject({
            action: 'compress_image',
            outcome,
            inputBytes: 5000,
            outputBytes,
        });
        expect(JSON.stringify(mockLogInfo.mock.calls[0])).not.toContain('secret-passport');
    });
});

describe('compressImage inspection download', () => {
    let createObjectURL: jest.Mock;
    let revokeObjectURL: jest.Mock;
    let clickSpy: jest.SpyInstance;
    let clickedDownloads: string[];

    beforeEach(() => {
        jest.resetAllMocks();
        jest.useFakeTimers();
        mockSupported.mockReturnValue(true);
        mockCompress.mockResolvedValue(success(1000));
        createObjectURL = jest.fn(() => 'blob:fake');
        revokeObjectURL = jest.fn();
        Object.assign(URL, { createObjectURL, revokeObjectURL });
        clickedDownloads = [];
        clickSpy = jest
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(function (this: HTMLAnchorElement) {
                clickedDownloads.push(this.download);
            });
    });

    afterEach(() => {
        delete process.env.NEXT_PUBLIC_DEBUG_COMPRESSION;
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('does not download in the test environment even when the flag is set', async () => {
        process.env.NEXT_PUBLIC_DEBUG_COMPRESSION = 'true';
        await compressImage(makeFile(5000));
        expect(createObjectURL).not.toHaveBeenCalled();
        expect(clickSpy).not.toHaveBeenCalled();
    });

    it('does not download in development without the opt-in flag', async () => {
        jest.replaceProperty(process.env, 'NODE_ENV', 'development');
        process.env.NEXT_PUBLIC_DEBUG_COMPRESSION = 'false';
        await compressImage(makeFile(5000));
        expect(createObjectURL).not.toHaveBeenCalled();
        expect(clickSpy).not.toHaveBeenCalled();
    });

    it('downloads <name>.webp in development with the flag, revoking the URL after 10 s', async () => {
        jest.replaceProperty(process.env, 'NODE_ENV', 'development');
        process.env.NEXT_PUBLIC_DEBUG_COMPRESSION = 'true';
        await compressImage(makeFile(5000, 'photo.jpg'));

        expect(clickedDownloads).toEqual(['photo.webp']);
        expect(revokeObjectURL).not.toHaveBeenCalled();
        jest.advanceTimersByTime(9_999);
        expect(revokeObjectURL).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    });

    it('still resolves compressed when the download path throws', async () => {
        jest.replaceProperty(process.env, 'NODE_ENV', 'development');
        process.env.NEXT_PUBLIC_DEBUG_COMPRESSION = 'true';
        createObjectURL.mockImplementation(() => {
            throw new Error('no blob urls');
        });
        const result = await compressImage(makeFile(5000));
        expect(result.type).toBe('image/webp');
    });
});
