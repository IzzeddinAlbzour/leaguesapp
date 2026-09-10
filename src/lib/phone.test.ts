import { describe, expect, it } from 'vitest';
import { formatPhone, normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('converts a local 05x number to E.164 digits', () => {
    expect(normalizePhone('0599123456')).toBe('972599123456');
  });

  it('accepts a number without the leading zero', () => {
    expect(normalizePhone('599123456')).toBe('972599123456');
  });

  it('accepts a number already in country form', () => {
    expect(normalizePhone('972569123456')).toBe('972569123456');
  });

  it('ignores spaces and dashes', () => {
    expect(normalizePhone('059-912 3456')).toBe('972599123456');
  });

  it('rejects a number that is too short', () => {
    expect(normalizePhone('05991234')).toBeNull();
  });

  it('rejects a non-mobile prefix', () => {
    expect(normalizePhone('0421234567')).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(normalizePhone('')).toBeNull();
  });
});

describe('formatPhone', () => {
  it('renders the grouped local form', () => {
    expect(formatPhone('972599123456')).toBe('059-912-3456');
  });

  it('passes through unparseable input unchanged', () => {
    expect(formatPhone('not a phone')).toBe('not a phone');
  });
});
