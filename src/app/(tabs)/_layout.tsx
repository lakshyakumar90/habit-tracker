import { useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import PagerView, { type PagerViewOnPageScrollEvent, type PagerViewOnPageSelectedEvent, type PagerViewRef } from '@expo/ui/community/pager-view';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, usePathname, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Today from './today';
import Habits from './habits';
import Tasks from './tasks';
import Stats from './stats';
import Profile from './profile';
import { useHabitly } from '../../features/app/AppProvider';
import { palette } from '../../theme/tokens';

const tabs = [
  { name: 'today', label: 'Today', active: 'view-dashboard', inactive: 'view-dashboard-outline', path: '/(tabs)/today' },
  { name: 'habits', label: 'Habits', active: 'sprout', inactive: 'sprout-outline', path: '/(tabs)/habits' },
  { name: 'tasks', label: 'Tasks', active: 'checkbox-marked-circle', inactive: 'checkbox-blank-circle-outline', path: '/(tabs)/tasks' },
  { name: 'stats', label: 'Stats', active: 'chart-box', inactive: 'chart-box-outline', path: '/(tabs)/stats' },
  { name: 'profile', label: 'Profile', active: 'account', inactive: 'account-outline', path: '/(tabs)/profile' },
] as const;
const pages = [Today, Habits, Tasks, Stats, Profile];
const paths: Href[] = tabs.map(tab => tab.path);

export default function TabLayout() {
  useHabitly();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const routeIndex = Math.max(0, tabs.findIndex(tab => pathname.endsWith(`/${tab.name}`)));
  const pager = useRef<PagerViewRef>(null);
  const progress = useSharedValue(routeIndex);
  const cellWidth = (width - 32 - 12) / tabs.length;

  useEffect(() => {
    pager.current?.setPage(routeIndex);
    // The page route can change from links inside a screen; keep the pill in sync.
    progress.value = withTiming(routeIndex, { duration: 180 });
  }, [progress, routeIndex]);

  const onPageScroll = useCallback((event: PagerViewOnPageScrollEvent) => {
    'worklet';
    // eslint-disable-next-line react-hooks/immutability
    progress.value = event.nativeEvent.position + event.nativeEvent.offset;
  }, [progress]);

  const onPageSelected = useCallback((event: PagerViewOnPageSelectedEvent) => {
    const index = event.nativeEvent.position;
    if (tabs[index] && !pathname.endsWith(`/${tabs[index].name}`)) router.navigate(paths[index]);
  }, [pathname]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * cellWidth }],
  }), [cellWidth]);

  return <View style={{ flex: 1, backgroundColor: palette.canvas }}>
    <PagerView
      ref={pager}
      initialPage={routeIndex}
      onPageScroll={onPageScroll}
      onPageSelected={onPageSelected}
      offscreenPageLimit={1}
      style={{ flex: 1 }}
    >
      {pages.map((Page, index) => <View key={tabs[index].name} style={{ flex: 1 }}><Page /></View>)}
    </PagerView>

    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 8) + 8, height: 72, padding: 6, borderRadius: 25, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 6, top: 6, bottom: 6, width: cellWidth, borderRadius: 19, backgroundColor: palette.purpleSoft }, indicatorStyle]} />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {tabs.map((tab, index) => <Pressable
          key={tab.name}
          accessibilityRole="tab"
          accessibilityState={{ selected: routeIndex === index }}
          accessibilityLabel={tab.label}
          onPress={() => {
            if (index === routeIndex) return;
            pager.current?.setPage(index);
          }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
        >
          <MaterialCommunityIcons name={(routeIndex === index ? tab.active : tab.inactive) as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={routeIndex === index ? palette.purple : palette.tabInactive} />
          <Text numberOfLines={1} style={{ color: routeIndex === index ? palette.ink : palette.tabInactive, fontSize: 10, fontWeight: routeIndex === index ? '700' : '500' }}>{tab.label}</Text>
        </Pressable>)}
      </View>
    </View>
  </View>;
}
