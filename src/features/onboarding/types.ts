export type OnboardingDraft = {
  ageRange: string;
  interests: string[];
  discoverySource: string;
  motivation: string;
};

export const interestOptions = [
  { id: 'fitness', label: 'Fitness', icon: 'run-fast', tint: 'purple' },
  { id: 'productivity', label: 'Productivity', icon: 'chart-bar', tint: 'neutral' },
  { id: 'study', label: 'Study', icon: 'book-open-page-variant', tint: 'yellow' },
  { id: 'sleep', label: 'Sleep', icon: 'moon-waning-crescent', tint: 'yellow' },
  { id: 'mindfulness', label: 'Mindfulness', icon: 'meditation', tint: 'neutral' },
  { id: 'reading', label: 'Reading', icon: 'book-outline', tint: 'neutral' },
  { id: 'health', label: 'Health', icon: 'heart-outline', tint: 'neutral' },
  { id: 'finance', label: 'Finance', icon: 'bank-outline', tint: 'neutral' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal', tint: 'neutral' },
] as const;

export const ageRanges = ['Under 18', '18 – 24', '25 – 34', '35 – 44', '45+'] as const;

export const discoveryOptions = [
  { label: 'Instagram', icon: 'instagram', color: '#D9578A' },
  { label: 'YouTube', icon: 'youtube', color: '#F04438' },
  { label: 'Google Search', icon: 'google', color: '#4285F4' },
  { label: 'Play Store', icon: 'google-play', color: '#2BAA72' },
  { label: 'Friend', icon: 'account-group-outline', color: '#8068EA' },
  { label: 'Reddit', icon: 'reddit', color: '#FF5700' },
  { label: 'Other', icon: 'dots-horizontal-circle-outline', color: '#8068EA' },
] as const;
