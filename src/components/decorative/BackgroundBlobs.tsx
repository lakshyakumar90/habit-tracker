import { StyleSheet, View } from 'react-native';
import { useOnboardingTheme } from '../../features/onboarding/theme';

type Props = { variant?: 'welcome' | 'onboarding' | 'celebration' };

/** Calm, deterministic pastel atmosphere used by the first-run screens. */
export function BackgroundBlobs({ variant = 'onboarding' }: Props) {
  const theme = useOnboardingTheme();
  const dark = theme.dark;
  const blobs = dark ? {
    violet: ['#51456F66', '#51456F00'] as const,
    lavender: ['#3C344F66', '#3C344F00'] as const,
    yellow: ['#62563750', '#62563700'] as const,
  } : {
    violet: ['#D9CAFFB8', '#EDE6FF00'] as const,
    lavender: ['#E8E0FFCC', '#F2EEFF00'] as const,
    yellow: ['#FFE68E99', '#FFF4CF00'] as const,
  };

  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.canvas }]}>
    <View style={[styles.blob, styles.topRight, { backgroundColor: blobs.violet[0] }]} />
    <View style={[styles.blob, styles.rightWarm, { backgroundColor: blobs.yellow[0] }]} />
    <View style={[styles.blob, styles.leftMid, { backgroundColor: blobs.lavender[0] }]} />
    <View style={[styles.blob, variant === 'welcome' ? styles.welcomeBottom : styles.bottomWash, { backgroundColor: blobs.lavender[0] }]} />
    <View style={[styles.blob, styles.bottomLeftWarm, { backgroundColor: blobs.yellow[0] }]} />
    <View style={[styles.blob, styles.bottomRightWarm, { backgroundColor: blobs.yellow[0] }]} />
  </View>;
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999 },
  topRight: { width: 330, height: 330, top: -165, right: -145, transform: [{ rotate: '-12deg' }] },
  rightWarm: { width: 210, height: 260, top: '15%', right: -140 },
  leftMid: { width: 270, height: 350, top: '26%', left: -205 },
  bottomWash: { width: '112%', height: 260, bottom: -155, left: -28, transform: [{ rotate: '17deg' }] },
  welcomeBottom: { width: '118%', height: 330, bottom: -172, left: -36, transform: [{ rotate: '18deg' }] },
  bottomLeftWarm: { width: 220, height: 330, bottom: -175, left: -145, transform: [{ rotate: '-17deg' }] },
  bottomRightWarm: { width: 150, height: 210, bottom: -150, right: -105, transform: [{ rotate: '12deg' }] },
});
