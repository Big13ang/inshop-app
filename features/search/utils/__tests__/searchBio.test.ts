import { removeEmojis, formatBioWithEllipsis } from '../searchBio';

describe('searchBio util', () => {
  describe('removeEmojis', () => {
    it('strips pictographic emojis from text', () => {
      expect(removeEmojis('فروشگاه لباس 👕👗🔥')).toBe('فروشگاه لباس');
    });

    it('handles empty or blank strings', () => {
      expect(removeEmojis('')).toBe('');
      expect(removeEmojis('   ')).toBe('');
    });
  });

  describe('formatBioWithEllipsis', () => {
    it('returns empty string if bio is empty or undefined', () => {
      expect(formatBioWithEllipsis(undefined)).toBe('');
      expect(formatBioWithEllipsis('')).toBe('');
      expect(formatBioWithEllipsis('   ')).toBe('');
    });

    it('returns text as-is if length is within maxLength', () => {
      expect(formatBioWithEllipsis('فروشگاه تخصصی پوشاک')).toBe('فروشگاه تخصصی پوشاک');
    });

    it('truncates longer text and appends ellipsis', () => {
      const longText = 'یک متن بسیار طولانی برای تست که بیشتر از شصت کاراکتر دارد و باید کوتاه شود.';
      const result = formatBioWithEllipsis(longText, 30);
      expect(result.endsWith('...')).toBe(true);
      expect(result).toBe(`${longText.slice(0, 30).trim()}...`);
    });
  });
});
