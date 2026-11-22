import { SiteThemeConfig, SiteThemePreset } from '../types/taba';

export interface ResolvedThemeClasses {
  headerBg: string;
  topStripBg: string;
  footerBg: string;
  primaryBtn: string;
  primaryText: string;
  accentBg: string;
  sectionBorder: string;
  pageBg: string;
  splashGradient: string;
  cardRadius: string;
  buttonRadius: string;
  desktopGridCols: string;
}

const PRESET_MAP: Record<
  SiteThemePreset,
  Omit<ResolvedThemeClasses, 'cardRadius' | 'buttonRadius' | 'desktopGridCols'>
> = {
  'royal-blue': {
    headerBg: 'bg-[#0b347e]',
    topStripBg: 'bg-[#d9273e]',
    footerBg: 'bg-gradient-to-br from-[#0b347e] to-[#1554b9]',
    primaryBtn: 'bg-[#1554b9] hover:bg-[#0e3a8a] text-white',
    primaryText: 'text-[#1554b9] dark:text-blue-400',
    accentBg: 'bg-[#d9273e]',
    sectionBorder: 'border-[#d9273e]',
    pageBg:
      'bg-gradient-to-b from-[#f6f8fd] via-[#f3f6fc] to-white dark:from-[#0d1424] dark:via-[#0d1424] dark:to-[#111a2e]',
    splashGradient: 'bg-[radial-gradient(circle_at_50%_30%,#2a6bdc,#0e3a8a_70%)]',
  },
  'deep-navy': {
    headerBg: 'bg-[#081c45]',
    topStripBg: 'bg-[#1554b9]',
    footerBg: 'bg-gradient-to-br from-[#081c45] to-[#0b347e]',
    primaryBtn: 'bg-[#0b347e] hover:bg-[#081c45] text-white',
    primaryText: 'text-[#0b347e] dark:text-blue-300',
    accentBg: 'bg-[#d9273e]',
    sectionBorder: 'border-[#1554b9]',
    pageBg:
      'bg-gradient-to-b from-[#f1f5fb] via-[#f5f7fc] to-white dark:from-[#090f1d] dark:via-[#0c1324] dark:to-[#111a2e]',
    splashGradient: 'bg-[radial-gradient(circle_at_50%_30%,#1554b9,#07193d_72%)]',
  },
  'ocean-blue': {
    headerBg: 'bg-[#1554b9]',
    topStripBg: 'bg-[#0b347e]',
    footerBg: 'bg-gradient-to-br from-[#1554b9] to-[#2563eb]',
    primaryBtn: 'bg-[#1d4ed8] hover:bg-[#1e40af] text-white',
    primaryText: 'text-[#1d4ed8] dark:text-sky-400',
    accentBg: 'bg-[#d9273e]',
    sectionBorder: 'border-[#1d4ed8]',
    pageBg:
      'bg-gradient-to-b from-[#eef5ff] via-[#f6f9ff] to-white dark:from-[#0c172b] dark:via-[#0e1b33] dark:to-[#111a2e]',
    splashGradient: 'bg-[radial-gradient(circle_at_50%_30%,#387df0,#10429c_72%)]',
  },
  'crimson-blue': {
    headerBg: 'bg-[#0b347e]',
    topStripBg: 'bg-[#b81f33]',
    footerBg: 'bg-gradient-to-br from-[#0b347e] via-[#123d90] to-[#8f1829]',
    primaryBtn: 'bg-[#d9273e] hover:bg-[#b81f33] text-white',
    primaryText: 'text-[#b81f33] dark:text-rose-400',
    accentBg: 'bg-[#1554b9]',
    sectionBorder: 'border-[#d9273e]',
    pageBg:
      'bg-gradient-to-b from-[#faf6f8] via-[#f4f7fc] to-white dark:from-[#120e1a] dark:via-[#0d1424] dark:to-[#111a2e]',
    splashGradient: 'bg-[radial-gradient(circle_at_50%_30%,#2a6bdc,#7f1628_80%)]',
  },
};

export function resolveSiteTheme(theme: SiteThemeConfig): ResolvedThemeClasses {
  const palette = PRESET_MAP[theme.colorPreset] ?? PRESET_MAP['royal-blue'];

  const cardRadius =
    theme.cardRadius === 'sharp'
      ? 'rounded-lg'
      : theme.cardRadius === 'rounded'
      ? 'rounded-3xl'
      : 'rounded-[19px]';

  const buttonRadius =
    theme.cardRadius === 'sharp'
      ? 'rounded-md'
      : theme.cardRadius === 'rounded'
      ? 'rounded-full'
      : 'rounded-xl';

  const desktopGridCols =
    theme.desktopColumns === 3
      ? 'md:grid-cols-3'
      : theme.desktopColumns === 5
      ? 'md:grid-cols-3 lg:grid-cols-5'
      : 'md:grid-cols-4';

  return {
    ...palette,
    cardRadius,
    buttonRadius,
    desktopGridCols,
  };
}
