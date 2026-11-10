import {
  LIGHT_THEME,
  DARK_THEME,
  PRIORITY_COLORS,
  CATEGORY_COLORS,
} from '../src/theme/tokens';

describe('Design Tokens Consistency', () => {
  test('priority colors match specification', () => {
    expect(PRIORITY_COLORS.high).toBe('#E5484D');
    expect(PRIORITY_COLORS.medium).toBe('#F5A524');
    expect(PRIORITY_COLORS.low).toBe('#30A46C');
  });

  test('category colors match specification', () => {
    expect(CATEGORY_COLORS.hackathon).toBe('#8E4EC6');
    expect(CATEGORY_COLORS.college).toBe('#3E63DD');
    expect(CATEGORY_COLORS.personal).toBe('#30A46C');
    expect(CATEGORY_COLORS.meeting).toBe('#F5A524');
    expect(CATEGORY_COLORS.competition).toBe('#D6409F');
    expect(CATEGORY_COLORS.other).toBe('#8B8D98');
  });

  test('light and dark theme tokens provide all required keys', () => {
    const requiredKeys = [
      'bg',
      'surface',
      'card',
      'border',
      'text',
      'muted',
      'primary',
      'primaryForeground',
      'destructive',
      'urgentBorder',
      'urgentBg',
    ];

    requiredKeys.forEach((key) => {
      expect(LIGHT_THEME).toHaveProperty(key);
      expect(DARK_THEME).toHaveProperty(key);
    });
  });
});

