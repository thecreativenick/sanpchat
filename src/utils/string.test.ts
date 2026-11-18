import { escapeRegex, uuidv4 } from './string';

describe('escapeRegex()', () => {
  it('leaves plain text untouched', () => {
    expect(escapeRegex('Julia Charles 123')).toBe('Julia Charles 123');
  });

  it('returns an empty string for empty input', () => {
    expect(escapeRegex('')).toBe('');
  });

  it('escapes every regex special character', () => {
    expect(escapeRegex('.*+?^${}()|[]\\')).toBe(
      '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'
    );
  });

  it('escapes repeated special characters', () => {
    expect(escapeRegex('a.b.c')).toBe('a\\.b\\.c');
  });

  it('produces a pattern that matches the input literally', () => {
    const input = 'Adela.Shields43 (+1) [test]? $5 a|b ^_^ c:\\';
    const pattern = new RegExp(`^${escapeRegex(input)}$`);
    expect(pattern.test(input)).toBe(true);
  });

  it('stops special characters acting as regex syntax', () => {
    // Unescaped, "." would match any character
    const pattern = new RegExp(escapeRegex('a.c'));
    expect(pattern.test('abc')).toBe(false);
    expect(pattern.test('a.c')).toBe(true);
  });

  it('makes input that would be an invalid regex safe to compile', () => {
    const unbalanced = '(';
    expect(() => new RegExp(unbalanced)).toThrow();
    expect(() => new RegExp(escapeRegex(unbalanced))).not.toThrow();
  });
});

describe('uuidv4()', () => {
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a string in RFC 4122 version 4 format', () => {
    expect(uuidv4()).toMatch(UUID_V4);
  });

  it('builds the id from Math.random (lowest value)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    // "x" -> 0, "y" -> (0 & 0x3) | 0x8 = 8
    expect(uuidv4()).toBe('00000000-0000-4000-8000-000000000000');
  });

  it('builds the id from Math.random (highest value)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9999);
    // "x" -> 15 (f), "y" -> (15 & 0x3) | 0x8 = 11 (b)
    expect(uuidv4()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  });

  it('calls Math.random once for each random character (31)', () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    uuidv4();
    expect(random).toHaveBeenCalledTimes(31);
  });

  it('produces different ids when Math.random returns different values', () => {
    const random = jest.spyOn(Math, 'random');

    random.mockReturnValue(0.1);
    const first = uuidv4();
    random.mockReturnValue(0.7);
    const second = uuidv4();

    expect(first).toBe('11111111-1111-4111-9111-111111111111');
    expect(second).toBe('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb');
  });
});
