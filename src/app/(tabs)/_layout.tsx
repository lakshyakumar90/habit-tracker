import { useCallback, useEffect, useRef, useState } from 'react';
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
  const { resolvedTheme } = useHabitly();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const pathIndex = tabs.findIndex(tab => pathname.endsWith(`/${tab.name}`));
  const [lastTabIndex, setLastTabIndex] = useState(() => Math.max(0, pathIndex));
  const selectedIndex = lastTabIndex;
  const pager = useRef<PagerViewRef>(null);
  const currentPath = useRef(pathname);
  const currentPage = useRef(Math.max(0, pathIndex));
  const visiblePage = useRef(Math.max(0, pathIndex));
  const pendingRoute = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(Math.max(0, pathIndex));
  const cellWidth = (width - 32 - 12) / tabs.length;

  useEffect(() => {
    currentPath.current = pathname;
    // A detail screen is stacked above this layout. Keep its last selected tab
    // mounted without commanding the hidden native pager to jump to Today.
    if (pathIndex < 0) {
      if (pendingRoute.current) clearTimeout(pendingRoute.current);
      return;
    }
    visiblePage.current = pathIndex;
    progress.value = withTiming(pathIndex, { duration: 180 });
    if (currentPage.current !== pathIndex) {
      currentPage.current = pathIndex;
      const selectionSync = setTimeout(() => setLastTabIndex(pathIndex), 0);
      pager.current?.setPage(pathIndex);
      return () => clearTimeout(selectionSync);
    }
  }, [pathIndex, pathname, progress]);

  const onPageScroll = useCallback((event: PagerViewOnPageScrollEvent) => {
    if (!tabs.some(tab => currentPath.current.endsWith(`/${tab.name}`))) return;
    const { position, offset } = event.nativeEvent;
    const nearest = Math.min(tabs.length - 1, position + (offset >= 0.5 ? 1 : 0));
    if (visiblePage.current !== nearest) {
      visiblePage.current = nearest;
      setLastTabIndex(nearest);
    }
    // eslint-disable-next-line react-hooks/immutability
    progress.value = position + offset;
  }, [progress]);

  const onPageSelected = useCallback((event: PagerViewOnPageSelectedEvent) => {
    const index = event.nativeEvent.position;
    const onTabRoute = tabs.some(tab => currentPath.current.endsWith(`/${tab.name}`));
    if (!tabs[index] || !onTabRoute) return;
    currentPage.current = index;
    visiblePage.current = index;
    setLastTabIndex(index);
    if (!currentPath.current.endsWith(`/${tabs[index].name}`)) {
      if (pendingRoute.current) clearTimeout(pendingRoute.current);
      pendingRoute.current = setTimeout(() => {
        if (currentPage.current !== index || !tabs.some(tab => currentPath.current.endsWith(`/${tab.name}`))) return;
        currentPath.current = paths[index] as string;
        router.navigate(paths[index]);
      }, 100);
    }
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * cellWidth }],
  }), [cellWidth]);

  return <View style={{ flex: 1, backgroundColor: palette.canvas }}>
    <PagerView
      key={resolvedTheme}
      ref={pager}
      initialPage={selectedIndex}
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
          accessibilityState={{ selected: selectedIndex === index }}
          accessibilityLabel={tab.label}
          onPress={() => {
            if (index === selectedIndex) return;
            currentPage.current = index;
            setLastTabIndex(index);
            pager.current?.setPage(index);
          }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
        >
          <MaterialCommunityIcons name={(selectedIndex === index ? tab.active : tab.inactive) as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={selectedIndex === index ? palette.purple : palette.tabInactive} />
          <Text numberOfLines={1} style={{ color: selectedIndex === index ? palette.ink : palette.tabInactive, fontSize: 10, fontWeight: selectedIndex === index ? '700' : '500' }}>{tab.label}</Text>
        </Pressable>)}
      </View>
    </View>
  </View>;
}
