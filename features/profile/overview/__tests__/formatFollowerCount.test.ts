import { formatFollowerCount } from '../formatFollowerCount';

describe('formatFollowerCount', () => {
  it.each([
    [1, '1'],
    [100, '100'],
    [999, '999'],
  ])('keeps numbers under 1000 as they are (%s)', (input, expected) => {
    expect(formatFollowerCount(input)).toBe(expected);
  });

  it.each([
    [1000, '1K'],
    [1500, '1.5K'],
    [12_345, '12.3K'],
    [999_999, '999.9K'],
  ])('formats thousands (%s)', (input, expected) => {
    expect(formatFollowerCount(input)).toBe(expected);
  });

  it.each([
    [1_000_000, '1M'],
    [1_200_000, '1.2M'],
    [25_600_000, '25.6M'],
  ])('formats millions (%s)', (input, expected) => {
    expect(formatFollowerCount(input)).toBe(expected);
  });

  it('formats billions', () => {
    expect(formatFollowerCount(2_500_000_000)).toBe('2.5B');
  });

  it('truncates instead of rounding', () => {
    expect(formatFollowerCount(1999)).toBe('1.9K');
  });

  it('accepts numeric strings', () => {
    expect(formatFollowerCount('1500')).toBe('1.5K');
    expect(formatFollowerCount('250')).toBe('250');
  });

  it.each([null, undefined, '', '0', 0, 'abc', -5, NaN])('returns empty string when there is nothing to show (%s)', (input) => {
    expect(formatFollowerCount(input)).toBe('');
  });
});
