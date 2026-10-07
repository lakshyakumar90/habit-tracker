import { useHabitlyTheme } from '../app/AppProvider';

const light = {
  dark: false,
  canvas: '#FBFAFF', surface: '#FFFFFF', surfaceSoft: '#F8F7FC', surfaceRaised: '#F3F1F8',
  ink: '#151329', muted: '#74728A', subtle: '#9C99AD', line: '#ECEAF3',
  purple: '#8B67F6', purpleSoft: '#EEE9FF', yellow: '#F8C955', yellowSoft: '#FFF4CF',
  danger: '#D94B55', cta: '#1E1E22', ctaPressed: '#101013', onPrimary: '#FFFFFF',
};

const dark = {
  dark: true,
  canvas: '#111016', surface: '#191820', surfaceSoft: '#22212A', surfaceRaised: '#292832',
  ink: '#F7F5FC', muted: '#A9A5B7', subtle: '#8B879B', line: '#2D2B36',
  purple: '#A98BFF', purpleSoft: '#302742', yellow: '#E9C66F', yellowSoft: '#352F21',
  danger: '#FF8C94', cta: '#29272F', ctaPressed: '#1D1B23', onPrimary: '#FFFFFF',
};

export function useOnboardingTheme() {
  const { resolvedTheme } = useHabitlyTheme();
  return resolvedTheme === 'dark' ? dark : light;
}
