/** Convert an OKLCH color (L 0–1, C ~0–0.37, H degrees) to an sRGB hex string, clamping out-of-gamut channels. */
export function oklchToHex(l: number, c: number, h: number): string {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return (
    '#' +
    linear
      .map((v) => {
        const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(v, 0) ** (1 / 2.4) - 0.055;
        return Math.round(Math.min(1, Math.max(0, srgb)) * 255)
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
      .toUpperCase()
  );
}

const RED_HUE = 25;
const GREEN_HUE = 150;

/**
 * Red → orange → yellow → green as `progress` goes 0 → 1 (eaten / target).
 * Interpolates hue in OKLCH, so the middle is a clean amber rather than the muddy brown of an RGB blend;
 * lightness lifts mid-way so the yellows read golden and lime instead of olive.
 * `track` is a pale tint of the same color for the unfilled part of a meter.
 */
export function progressColors(progress: number, dark: boolean): { fill: string; track: string } {
  const t = Math.min(1, Math.max(0, progress));
  const hue = RED_HUE + (GREEN_HUE - RED_HUE) * t;
  const mid = Math.sin(Math.PI * t) ** 0.8;
  return dark
    ? { fill: oklchToHex(0.72 + 0.05 * mid, 0.18, hue), track: oklchToHex(0.3, 0.04, hue) }
    : { fill: oklchToHex(0.63 + 0.1 * mid, 0.19, hue), track: oklchToHex(0.95, 0.03, hue) };
}
