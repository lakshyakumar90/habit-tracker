import { router } from 'expo-router';
import Animated, { useReducedMotion, FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundBlobs } from '../../components/decorative/BackgroundBlobs';
import { useOnboardingTheme } from './theme';
import { appRoute } from '../../utils/routes';
import { HabitlyMark, PrimaryActionButton } from './OnboardingChrome';

export function WelcomeScreen() {
  const theme = useOnboardingTheme();
  const reducedMotion = useReducedMotion();
  const entrance = reducedMotion ? FadeIn.duration(140) : FadeIn.duration(460);
  const start = () => router.push(appRoute('/onboarding'));

  return <View style={{ flex: 1, backgroundColor: theme.canvas, overflow: 'hidden' }}>
    <BackgroundBlobs variant="welcome" />
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 8, paddingBottom: 14, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <Animated.View entering={reducedMotion ? entrance : ZoomIn.duration(500).delay(80)}>
            <HabitlyMark size={122} />
          </Animated.View>
          <Animated.View entering={entrance} style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ color: theme.ink, fontSize: 49, lineHeight: 58, letterSpacing: -1.7, fontWeight: '800' }}>Habitly</Text>
            <Text style={{ color: theme.muted, fontSize: 21, lineHeight: 29, textAlign: 'center' }}>Small habits.{ '\n' }A better you.</Text>
          </Animated.View>
        </View>
        <View style={{ gap: 18 }}>
          <Animated.View entering={reducedMotion ? entrance : FadeInDown.duration(420).delay(240)} style={{ flexDirection: 'row', justifyContent: 'center', gap: 11, paddingBottom: 32 }}>
            {[0, 1, 2].map(index => <View key={index} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: index === 0 ? theme.purple : theme.purpleSoft }} />)}
          </Animated.View>
          <Animated.View entering={reducedMotion ? entrance : FadeInDown.duration(420).delay(300)}>
            <PrimaryActionButton label="Get Started" onPress={start} />
          </Animated.View>
          <Animated.View entering={entrance}>
            <Text style={{ textAlign: 'center', color: theme.muted, fontSize: 14, lineHeight: 20 }}>Build consistency, one day at a time.</Text>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  </View>;
}
