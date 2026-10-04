import { router } from 'expo-router';
import Animated, { useReducedMotion, FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 8, paddingBottom: 18, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <HabitlyMark size={40} />
          <View style={{ flex: 1, height: 5, flexDirection: 'row', gap: 5 }}>{Array.from({ length: 4 }, (_, index) => <View key={index} accessibilityLabel={index === 0 ? 'Step 1 of 4' : undefined} style={{ flex: 1, borderRadius: 4, backgroundColor: index === 0 ? theme.purple : theme.purpleSoft }} />)}</View>
          <Pressable accessibilityRole="button" onPress={start} hitSlop={8}><Text style={{ color: theme.muted, fontSize: 13, fontWeight: '600' }}>Skip</Text></Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 23 }}>
          <Animated.View entering={reducedMotion ? entrance : ZoomIn.duration(500).delay(80)} style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: -94, top: 10, width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.purpleSoft, transform: [{ rotate: '-15deg' }] }}><MaterialCommunityIcons name="weight-lifter" size={26} color={theme.ink} /></View>
            <View style={{ position: 'absolute', right: -94, top: 12, width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.yellowSoft, transform: [{ rotate: '12deg' }] }}><MaterialCommunityIcons name="book-open-variant" size={26} color={theme.ink} /></View>
            <HabitlyMark size={144} />
          </Animated.View>
          <Animated.View entering={entrance} style={{ alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
            <Text style={{ color: theme.ink, fontSize: 31, lineHeight: 37, letterSpacing: -0.8, fontWeight: '800', textAlign: 'center' }}>Small habits{ '\n' }create a bigger you</Text>
            <Text style={{ color: theme.muted, fontSize: 16, lineHeight: 23, textAlign: 'center' }}>Track your habits, stay consistent{ '\n' }and become the best version{ '\n' }of yourself.</Text>
          </Animated.View>
        </View>
        <View style={{ gap: 17 }}>
          <Animated.View entering={reducedMotion ? entrance : FadeInDown.duration(420).delay(240)} style={{ flexDirection: 'row', justifyContent: 'center', gap: 9, paddingBottom: 5 }}>
            {[0, 1, 2, 3].map(index => <View key={index} style={{ width: index === 0 ? 10 : 8, height: index === 0 ? 10 : 8, borderRadius: 5, backgroundColor: index === 0 ? theme.purple : theme.purpleSoft }} />)}
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
