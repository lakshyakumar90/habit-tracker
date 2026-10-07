import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Today from './today';
import Habits from './habits';
import Tasks from './tasks';
import Stats from './stats';
import Profile from './profile';
import { useHabitlyTheme } from '../../features/app/AppProvider';
import { palette } from '../../theme/tokens';
import { pageIndexAtOffset } from '../../features/navigation/pager';

const tabs = [
  { name: 'today', label: 'Today', active: 'view-dashboard', inactive: 'view-dashboard-outline' },
  { name: 'habits', label: 'Habits', active: 'sprout', inactive: 'sprout-outline' },
  { name: 'tasks', label: 'Tasks', active: 'checkbox-marked-circle', inactive: 'checkbox-blank-circle-outline' },
  { name: 'stats', label: 'Stats', active: 'chart-box', inactive: 'chart-box-outline' },
  { name: 'profile', label: 'Profile', active: 'account', inactive: 'account-outline' },
] as const;
const pages = [memo(Today), memo(Habits), memo(Tasks), memo(Stats), memo(Profile)];
const PageCell = memo(function PageCell({ index, width }: { index: number; width: number }) {
  const Page = pages[index];
  return <View style={{ width, flex: 1 }}><Page /></View>;
});

export default function TabLayout() {
  const { accent } = useHabitlyTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const pathIndex = tabs.findIndex(tab => pathname.endsWith(`/${tab.name}`));
  const initialIndex = Math.max(0, pathIndex);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const selected = useRef(initialIndex);
  const userDragging = useRef(false);
  const fadeFrame = useRef<number | null>(null);
  const pager = useRef<ScrollView>(null);
  const previousWidth = useRef(width);
  const position = useSharedValue(initialIndex);
  const fade = useSharedValue(1);
  const cellWidth = (width - 44) / tabs.length;

  const select = useCallback((index: number) => {
    if (selected.current === index) return;
    selected.current = index;
    setActiveIndex(index);
  }, []);

  const showPage = useCallback((index: number, animateAdjacent: boolean) => {
    if (index < 0 || index >= tabs.length) return;
    if (index === selected.current && !userDragging.current) return;
    const adjacent = animateAdjacent && Math.abs(index - selected.current) === 1 && !userDragging.current;
    userDragging.current = false;
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);
    // eslint-disable-next-line react-hooks/immutability
    if (adjacent) fade.value = 1;
    if (!adjacent) {
      // Only a distant jump fades; the native pager owns all swipe motion.
      fade.value = 0;
    }
    select(index);
    pager.current?.scrollTo({ x: index * width, animated: adjacent });
    if (!adjacent) {
      // eslint-disable-next-line react-hooks/immutability
      position.value = index;
      fadeFrame.current = requestAnimationFrame(() => {
        fadeFrame.current = null;
        fade.value = withTiming(1, { duration: 180 });
      });
    }
  }, [fade, position, select, width]);

  // Other screens can link to a tab. A tab tap or swipe never writes another
  // route, so a route update cannot replay the pager transition.
  useEffect(() => {
    if (pathIndex >= 0 && pathIndex !== selected.current) showPage(pathIndex, false);
  }, [pathIndex, showPage]);

  useEffect(() => {
    if (previousWidth.current === width) return;
    previousWidth.current = width;
    pager.current?.scrollTo({ x: selected.current * width, animated: false });
    // eslint-disable-next-line react-hooks/immutability
    position.value = selected.current;
  }, [position, width]);

  useEffect(() => () => {
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);
  }, []);

  const onScroll = useAnimatedScrollHandler({
    // eslint-disable-next-line react-hooks/immutability
    onScroll: event => { position.value = event.contentOffset.x / width; },
  }, [width]);
  const onScrollBeginDrag = useCallback(() => {
    userDragging.current = true;
  }, []);
  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!userDragging.current) return;
    userDragging.current = false;
    select(pageIndexAtOffset(event.nativeEvent.contentOffset.x, width, tabs.length));
  }, [select, width]);
  const onScrollEndDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!userDragging.current) return;
    if (Math.abs(event.nativeEvent.velocity?.x ?? 0) > 0.01) return;
    const index = pageIndexAtOffset(event.nativeEvent.contentOffset.x, width, tabs.length);
    if (Math.abs(event.nativeEvent.contentOffset.x - index * width) < 1) { userDragging.current = false; select(index); }
  }, [select, width]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value * cellWidth }] }), [cellWidth]);
  const contentStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return <View style={{ flex: 1, backgroundColor: palette.canvas }}>
    <Animated.View style={[{ flex: 1 }, contentStyle]}>
      <Animated.ScrollView ref={pager} horizontal pagingEnabled directionalLockEnabled bounces={false}
        showsHorizontalScrollIndicator={false} scrollEventThrottle={16} onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag} onScrollEndDrag={onScrollEndDrag} onMomentumScrollEnd={onMomentumScrollEnd}
        contentOffset={{ x: initialIndex * width, y: 0 }} style={{ flex: 1 }}>
        {tabs.map((tab, index) => <PageCell key={tab.name} index={index} width={width} />)}
      </Animated.ScrollView>
    </Animated.View>
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 8) + 8, height: 72, padding: 6, borderRadius: 25, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 6, top: 6, bottom: 6, width: cellWidth, borderRadius: 19, backgroundColor: palette.purpleSoft }, indicatorStyle]} />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {tabs.map((tab, index) => <Pressable key={tab.name} accessibilityRole="tab" accessibilityState={{ selected: activeIndex === index }} accessibilityLabel={tab.label}
          onPress={() => showPage(index, true)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <MaterialCommunityIcons name={(activeIndex === index ? tab.active : tab.inactive) as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={activeIndex === index ? accent : palette.tabInactive} />
          <Text numberOfLines={1} style={{ color: activeIndex === index ? palette.ink : palette.tabInactive, fontSize: 10, fontWeight: activeIndex === index ? '700' : '500' }}>{tab.label}</Text>
        </Pressable>)}
      </View>
    </View>
  </View>;
}
