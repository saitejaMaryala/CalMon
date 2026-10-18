import {
  calorieAverages,
  caloriesByDay,
  dayRange,
  groupForSlot,
  niceTicks,
  weightByDay,
  weightChange,
  weightRuns,
} from '../stats';

describe('dayRange', () => {
  it('includes both ends and crosses month boundaries', () => {
    expect(dayRange('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });
});

describe('caloriesByDay', () => {
  it('groups late-night snacks with snacks and fills empty days with zeros', () => {
    const days = ['2026-10-01', '2026-10-02'];
    const out = caloriesByDay(days, [
      { date: '2026-10-01', slot: 'breakfast', kcal: 400 },
      { date: '2026-10-01', slot: 'snack', kcal: 150 },
      { date: '2026-10-01', slot: 'latenight', kcal: 100 },
      { date: '2026-09-30', slot: 'lunch', kcal: 999 }, // outside range, ignored
    ]);
    expect(out[0]).toEqual({ date: '2026-10-01', breakfast: 400, lunch: 0, dinner: 0, snacks: 250, total: 650 });
    expect(out[1].total).toBe(0);
    expect(groupForSlot('latenight')).toBe('snacks');
  });
});

describe('weights', () => {
  const days = ['d1', 'd2', 'd3', 'd4', 'd5'];
  const values = weightByDay(days, [
    { date: 'd1', kg: 72 },
    { date: 'd2', kg: 71.8 },
    { date: 'd4', kg: 71.5 },
  ]);

  it('leaves null gaps for missing days', () => {
    expect(values).toEqual([72, 71.8, null, 71.5, null]);
  });

  it('splits the line into runs at gaps', () => {
    expect(weightRuns(values)).toEqual([
      [0, 1],
      [3, 3],
    ]);
    expect(weightRuns([null, null])).toEqual([]);
  });

  it('reports change from first to last logged weight', () => {
    expect(weightChange(values)).toEqual({ first: 72, last: 71.5, delta: -0.5 });
    expect(weightChange([null])).toBeNull();
  });
});

describe('calorieAverages', () => {
  it('averages only over days with something logged', () => {
    const avg = calorieAverages([
      { date: 'a', breakfast: 400, lunch: 600, dinner: 800, snacks: 200, total: 2000 },
      { date: 'b', breakfast: 0, lunch: 0, dinner: 0, snacks: 0, total: 0 },
      { date: 'c', breakfast: 200, lunch: 600, dinner: 1000, snacks: 0, total: 1800 },
    ]);
    expect(avg).toEqual({ loggedDays: 2, total: 1900, breakfast: 300, lunch: 600, dinner: 900, snacks: 100 });
  });
});

describe('niceTicks', () => {
  it('produces round steps that cover the range', () => {
    expect(niceTicks(0, 2620)).toEqual([0, 1000, 2000, 3000]);
    const t = niceTicks(71.3, 72.6);
    expect(t[0]).toBeLessThanOrEqual(71.3);
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(72.6);
  });
});
