import { constructMetadata, formatTitle, formatDescription, truncateText, isDevEnvironment } from '../metadata';

describe('isDevEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns true when APP_ENV is dev', () => {
    process.env.APP_ENV = 'dev';
    expect(isDevEnvironment()).toBe(true);
  });

  it('returns true when NEXT_PUBLIC_APP_ENV is dev', () => {
    delete process.env.APP_ENV;
    process.env.NEXT_PUBLIC_APP_ENV = 'dev';
    expect(isDevEnvironment()).toBe(true);
  });

  it('returns false in production', () => {
    process.env.APP_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    expect(isDevEnvironment()).toBe(false);
  });
});

describe('formatTitle', () => {
  it('formats title with both title and shopName without appending site name suffix', () => {
    expect(formatTitle('قهوه اسپرسو', 'فروشگاه راین')).toBe('قهوه اسپرسو - فروشگاه راین');
  });

  it('formats title with only title', () => {
    expect(formatTitle('قهوه اسپرسو')).toBe('قهوه اسپرسو');
  });

  it('formats title with only shopName', () => {
    expect(formatTitle(undefined, 'فروشگاه راین')).toBe('فروشگاه راین');
  });

  it('returns undefined when no title or shopName is provided so Next.js falls back to default title', () => {
    expect(formatTitle()).toBeUndefined();
    expect(formatTitle('', '')).toBeUndefined();
    expect(formatTitle(undefined, null)).toBeUndefined();
  });

  it('strips accidental duplicate site name suffix', () => {
    expect(formatTitle('قهوه اسپرسو | اینشاپ')).toBe('قهوه اسپرسو');
    expect(formatTitle('قهوه اسپرسو', 'فروشگاه راین | اینشاپ')).toBe('قهوه اسپرسو - فروشگاه راین');
  });

  it('returns undefined if heading matches default title or site name alone', () => {
    expect(formatTitle('اینشاپ')).toBeUndefined();
    expect(formatTitle('اینشاپ | انتخابهای باکیفیت برای خرید آنلاین')).toBeUndefined();
  });
});

describe('formatDescription', () => {
  it('returns custom description when provided', () => {
    expect(formatDescription('توضیحات اختصاصی محصول')).toBe('توضیحات اختصاصی محصول');
  });

  it('returns default description with shopName when description is omitted', () => {
    const res = formatDescription(undefined, 'فروشگاه راین');
    expect(res).toContain('فروشگاه راین');
  });

  it('returns default description when both are omitted', () => {
    const res = formatDescription();
    expect(res).toContain('اینشاپ کالاهای باکیفیت فروشگاههای مستقل');
  });
});

describe('constructMetadata', () => {
  it('constructs metadata with formatted title and openGraph/twitter objects', () => {
    const meta = constructMetadata({
      title: 'محصول ۱',
      shopName: 'فروشگاه تستی',
      description: 'توضیحات تستی',
      image: 'https://example.com/img.jpg',
    });

    expect(meta.title).toBe('محصول ۱ - فروشگاه تستی');
    expect(meta.description).toBe('توضیحات تستی');
    expect(meta.openGraph?.title).toBe('محصول ۱ - فروشگاه تستی');
    expect(meta.twitter?.title).toBe('محصول ۱ - فروشگاه تستی');
  });

  it('omits title field when no title or shopName is provided (letting layout template handle default)', () => {
    const meta = constructMetadata({});
    expect(meta.title).toBeUndefined();
    expect(meta.openGraph?.title).toBeUndefined();
    expect(meta.twitter?.title).toBeUndefined();
  });

  it('sets noIndex robots when noIndex is true or in dev environment', () => {
    const meta = constructMetadata({
      title: 'صفحه پیدا نشد',
      noIndex: true,
    });

    expect(meta.title).toBe('صفحه پیدا نشد');
    expect(meta.robots).toEqual(
      expect.objectContaining({
        index: false,
        follow: false,
      })
    );
  });
});

describe('truncateText', () => {
  it('truncates text exceeding maxLength and appends ellipsis', () => {
    expect(truncateText('یک متن خیلی طولانی برای تست', 10)).toBe('یک متن خیل...');
  });

  it('returns original trimmed text if within maxLength', () => {
    expect(truncateText('متن کوتاه', 20)).toBe('متن کوتاه');
  });
});
