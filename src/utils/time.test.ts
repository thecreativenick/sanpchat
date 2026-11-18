import { relativeTime } from './time';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

// Fixed "current time" so results never depend on the real clock
const NOW = new Date('2021-06-15T12:00:00Z').getTime();

describe('relativeTime()', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const ago = (elapsed: number) => relativeTime(NOW - elapsed);

  it('uses the faked clock', () => {
    expect(ago(0)).toBe('0 seconds ago');
    expect(Date.now).toHaveBeenCalled();
  });

  describe('seconds', () => {
    it('formats elapsed time under a minute as seconds', () => {
      expect(ago(45 * SECOND)).toBe('45 seconds ago');
    });

    it('rounds partial seconds down', () => {
      expect(ago(1999)).toBe('1 second ago');
    });

    it('stays in seconds right up to the minute boundary', () => {
      expect(ago(MINUTE - 1)).toBe('59 seconds ago');
    });
  });

  describe('minutes', () => {
    it('switches to minutes at exactly one minute', () => {
      expect(ago(MINUTE)).toBe('1 minute ago');
    });

    it('formats elapsed time under an hour as minutes', () => {
      expect(ago(30 * MINUTE + 59 * SECOND)).toBe('30 minutes ago');
    });

    it('stays in minutes right up to the hour boundary', () => {
      expect(ago(HOUR - 1)).toBe('59 minutes ago');
    });
  });

  describe('hours', () => {
    it('switches to hours at exactly one hour', () => {
      expect(ago(HOUR)).toBe('1 hour ago');
    });

    it('stays in hours right up to the day boundary', () => {
      expect(ago(DAY - 1)).toBe('23 hours ago');
    });
  });

  describe('days', () => {
    it('switches to days at exactly one day', () => {
      expect(ago(DAY)).toBe('1 day ago');
    });

    it('stays in days right up to the 30-day month boundary', () => {
      expect(ago(MONTH - 1)).toBe('29 days ago');
    });
  });

  describe('months', () => {
    it('switches to months at exactly 30 days', () => {
      expect(ago(MONTH)).toBe('1 month ago');
    });

    it('stays in months right up to the 365-day year boundary', () => {
      // 364.99 days / 30 = 12.16 -> "12 months", since a "month" is fixed at 30 days
      expect(ago(YEAR - 1)).toBe('12 months ago');
    });
  });

  describe('years', () => {
    it('switches to years at exactly 365 days', () => {
      expect(ago(YEAR)).toBe('1 year ago');
    });

    it('formats multiple years', () => {
      expect(ago(3 * YEAR + 100 * DAY)).toBe('3 years ago');
    });
  });

  it('works with real timestamps from the mock API', () => {
    // First snap in public/api/snaps.json, 2020-06-30T04:00:00Z
    expect(relativeTime(1593489600000)).toBe('11 months ago');
  });

  describe('singular and plural units', () => {
    const units = [
      { unit: 'second', ms: SECOND },
      { unit: 'minute', ms: MINUTE },
      { unit: 'hour', ms: HOUR },
      { unit: 'day', ms: DAY },
      { unit: 'month', ms: MONTH },
      { unit: 'year', ms: YEAR }
    ];

    units.forEach(({ unit, ms }) => {
      it(`uses the singular for exactly 1 ${unit}`, () => {
        expect(ago(ms)).toBe(`1 ${unit} ago`);
      });

      it(`uses the plural for 2 ${unit}s`, () => {
        expect(ago(2 * ms)).toBe(`2 ${unit}s ago`);
      });
    });

    it('uses the singular when a partial unit rounds down to 1', () => {
      expect(ago(MINUTE + 59 * SECOND)).toBe('1 minute ago');
      expect(ago(2 * DAY - 1)).toBe('1 day ago');
    });

    it('uses the plural for 0 (a timestamp of exactly now)', () => {
      expect(ago(0)).toBe('0 seconds ago');
      expect(ago(999)).toBe('0 seconds ago');
    });
  });

  describe('future timestamps', () => {
    it('shows "just now" for a timestamp 1ms in the future', () => {
      expect(relativeTime(NOW + 1)).toBe('just now');
    });

    it('shows "just now" for a timestamp seconds in the future', () => {
      expect(relativeTime(NOW + 5 * SECOND)).toBe('just now');
    });

    it('shows "just now" for a timestamp far in the future', () => {
      expect(relativeTime(NOW + 3 * YEAR)).toBe('just now');
    });

    it('never returns a negative number', () => {
      [1, SECOND, MINUTE, HOUR, DAY, MONTH, YEAR].forEach((ahead) => {
        expect(relativeTime(NOW + ahead)).not.toMatch(/-/);
      });
    });
  });
});
