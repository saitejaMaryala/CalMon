export interface Palette {
  bg: string;
  bgSoft: string;
  card: string;
  border: string;
  text: string;
  textSoft: string;
  textFaint: string;
  primary: string;
  primarySoft: string;
  green: string;
  greenSoft: string;
  amber: string;
  amberSoft: string;
  blue: string;
  blueSoft: string;
  danger: string;
  onAccent: string;
  shadow: string;
  ringTrack: string;
  /** Chart gridlines: one hairline step off the card surface. */
  grid: string;
  /** Meal series colors for charts (validated for color-blind separation in both modes). */
  mealBreakfast: string;
  mealLunch: string;
  mealDinner: string;
  mealSnacks: string;
  /** Work category colors (validated together for color-blind separation in both modes). */
  workAcademics: string;
  workResearch: string;
  workPersonal: string;
}

export const light: Palette = {
  bg: '#F6F7F9',
  bgSoft: '#EEF0F4',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSoft: '#6B7280',
  textFaint: '#9CA3AF',
  primary: '#5B5BD6',
  primarySoft: '#ECECFB',
  green: '#22A55B',
  greenSoft: '#E4F5EB',
  amber: '#F2A516',
  amberSoft: '#FDF2DC',
  blue: '#1E9BD7',
  blueSoft: '#E1F2FB',
  danger: '#E5484D',
  onAccent: '#FFFFFF',
  shadow: 'rgba(17, 24, 39, 0.06)',
  ringTrack: '#ECEEF2',
  grid: '#EEF0F3',
  mealBreakfast: '#EDA100',
  mealLunch: '#2A78D6',
  mealDinner: '#EB6834',
  mealSnacks: '#1BAF7A',
  workAcademics: '#2A78D6',
  workResearch: '#EB6834',
  workPersonal: '#6250D6',
};

export const dark: Palette = {
  bg: '#0E1015',
  bgSoft: '#171A21',
  card: '#1A1D25',
  border: '#272B35',
  text: '#F3F4F6',
  textSoft: '#A3A9B5',
  textFaint: '#6B7280',
  primary: '#8484F2',
  primarySoft: '#25264A',
  green: '#3CCB7F',
  greenSoft: '#16302A',
  amber: '#F5B83D',
  amberSoft: '#382D15',
  blue: '#45B5EA',
  blueSoft: '#14303F',
  danger: '#F2686C',
  onAccent: '#0E1015',
  shadow: 'rgba(0, 0, 0, 0.4)',
  ringTrack: '#272B35',
  grid: '#252935',
  mealBreakfast: '#C98500',
  mealLunch: '#3987E5',
  mealDinner: '#D95926',
  mealSnacks: '#199E70',
  workAcademics: '#3987E5',
  workResearch: '#D95926',
  workPersonal: '#9085E9',
};

/** Work mode swaps the indigo accent for teal so the switch is obvious at a glance. */
export const workAccent = {
  light: { primary: '#0E7C86', primarySoft: '#DDF1F0' },
  dark: { primary: '#3CC4C0', primarySoft: '#123534' },
};

/** Plus Jakarta Sans for headings and big numbers, Inter for body text. */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_600SemiBold',
  heading: 'PlusJakartaSans_700Bold',
  heavy: 'PlusJakartaSans_800ExtraBold',
  /** Light italic for notes and quoted descriptions. */
  quote: 'Inter_300Light_Italic',
};

export const radius = { sm: 10, md: 14, lg: 18, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
