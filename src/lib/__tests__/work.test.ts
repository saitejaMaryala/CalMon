import { formatHours, formatMinutes, goalStreak, sessionTitle, workAverages, workByDay } from '../work';

describe('formatMinutes', () => {
  it('formats hours and minutes compactly', () => {
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(180)).toBe('3h');
    expect(formatMinutes(135)).toBe('2h 15m');
    expect(formatMinutes(0)).toBe('0m');
    expect(formatHours(7.5)).toBe('7.5h');
  });
});

describe('workByDay', () => {
  it('sums minutes per category and fills empty days', () => {
    const out = workByDay(
      ['2026-11-01', '2026-11-02'],
      [
        { date: '2026-11-01', category: 'academics', minutes: 120 },
        { date: '2026-11-01', category: 'research', minutes: 90 },
        { date: '2026-11-01', category: 'research', minutes: 30 },
        { date: '2026-10-31', category: 'personal', minutes: 999 }, // outside range
      ],
    );
    expect(out[0]).toEqual({ date: '2026-11-01', total: 240, values: { academics: 120, research: 120, personal: 0 } });
    expect(out[1].total).toBe(0);
  });
});

describe('workAverages', () => {
  it('averages only over days with work', () => {
    const days = workByDay(
      ['a', 'b', 'c'],
      [
        { date: 'a', category: 'academics', minutes: 300 },
        { date: 'c', category: 'research', minutes: 500 },
      ],
    );
    expect(workAverages(days)).toEqual({ workedDays: 2, total: 400, academics: 150, research: 250, personal: 0 });
  });
});

describe('goalStreak', () => {
  const day = (total: number) => ({ date: '', total, values: { academics: total, research: 0, personal: 0 } });
  it('counts consecutive goal days, ignoring an unfinished today', () => {
    expect(goalStreak([day(480), day(500), day(490), day(100)], 480)).toBe(3);
    expect(goalStreak([day(480), day(200), day(480), day(480)], 480)).toBe(2);
    expect(goalStreak([day(100)], 480)).toBe(0);
  });
});

describe('sessionTitle', () => {
  it('uses the title, falling back to the category name for untitled sessions', () => {
    expect(sessionTitle({ title: 'OS lecture', category: 'academics' })).toBe('OS lecture');
    expect(sessionTitle({ title: '  ', category: 'personal' })).toBe('Personal Projects');
    expect(sessionTitle({ title: '', category: 'research' })).toBe('Research');
  });
});
