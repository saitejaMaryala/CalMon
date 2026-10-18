import { oklchToHex, progressColors } from '../color';

describe('oklchToHex', () => {
  it('maps white and black exactly', () => {
    expect(oklchToHex(1, 0, 0)).toBe('#FFFFFF');
    expect(oklchToHex(0, 0, 0)).toBe('#000000');
  });
});

describe('progressColors', () => {
  const hue = (hex: string) => {
    const [r, g] = [1, 3].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return { r, g };
  };

  it('goes from red at 0 to green at the target and clamps outside 0–1', () => {
    const start = hue(progressColors(0, false).fill);
    const end = hue(progressColors(1, false).fill);
    expect(start.r).toBeGreaterThan(start.g);
    expect(end.g).toBeGreaterThan(end.r);
    expect(progressColors(-1, false)).toEqual(progressColors(0, false));
    expect(progressColors(2, true)).toEqual(progressColors(1, true));
  });
});
