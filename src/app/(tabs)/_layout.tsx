import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { router, usePathname, type Href } from 'expo-router';
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
  { name: 'today', label: 'Today', active: 'view-dashboard', inactive: 'view-dashboard-outline', path: '/(tabs)/today' },
  { name: 'habits', label: 'Habits', active: 'sprout', inactive: 'sprout-outline', path: '/(tabs)/habits' },
  { name: 'tasks', label: 'Tasks', active: 'checkbox-marked-circle', inactive: 'checkbox-blank-circle-outline', path: '/(tabs)/tasks' },
  { name: 'stats', label: 'Stats', active: 'chart-box', inactive: 'chart-box-outline', path: '/(tabs)/stats' },
  { name: 'profile', label: 'Profile', active: 'account', inactive: 'account-outline', path: '/(tabs)/profile' },
] as const;
const pages = [Today, Habits, Tasks, Stats, Profile];
const paths: Href[] = tabs.map(tab => tab.path);
const PageList = Animated.FlatList<number>;

export default function TabLayout() {
  const { resolvedTheme } = useHabitlyTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const pathIndex = tabs.findIndex(tab => pathname.endsWith(`/${tab.name}`));
  const initialIndex = Math.max(0, pathIndex);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const pager = useRef<FlatList<number>>(null);
  const currentPath = useRef(pathname);
  const currentPage = useRef(initialIndex);
  const previousWidth = useRef(width);
  const pendingSettle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(initialIndex);
  const lastReportedIndex = useSharedValue(initialIndex);
  const cellWidth = (width - 32 - 12) / tabs.length;

  const cancelSettle = useCallback(() => {
    if (pendingSettle.current) clearTimeout(pendingSettle.current);
    pendingSettle.current = null;
  }, []);

  const settlePage = useCallback((offsetX: number) => {
    const index = pageIndexAtOffset(offsetX, width, tabs.length);
    currentPage.current = index;
    setSelectedIndex(index);
    // Reanimated shared values are intentionally updated in interaction callbacks.
    // eslint-disable-next-line react-hooks/immutability
    progress.value = index;
    // eslint-disable-next-line react-hooks/immutability
    lastReportedIndex.value = index;

    if (!tabs.some(tab => currentPath.current.endsWith(`/${tab.name}`))) return;
    const targetPath = paths[index] as string;
    if (currentPath.current !== targetPath) {
      currentPath.current = targetPath;
      router.navigate(paths[index]);
    }
  }, [lastReportedIndex, progress, width]);

  const reportVisibleIndex = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  useEffect(() => {
    currentPath.current = pathname;
    // Detail routes sit above the tabs. Leave the tab list untouched while it is covered.
    if (pathIndex < 0) {
      cancelSettle();
      return;
    }

    if (currentPage.current !== pathIndex) {
      currentPage.current = pathIndex;
      setSelectedIndex(pathIndex);
      // Reanimated shared values are intentionally synchronized to external routes.
      // eslint-disable-next-line react-hooks/immutability
      progress.value = pathIndex;
      // eslint-disable-next-line react-hooks/immutability
      lastReportedIndex.value = pathIndex;
      pager.current?.scrollToOffset({ offset: pathIndex * width, animated: true });
    }
  }, [cancelSettle, lastReportedIndex, pathIndex, pathname, progress, width]);

  useEffect(() => () => cancelSettle(), [cancelSettle]);

  useEffect(() => {
    if (previousWidth.current === width) return;
    previousWidth.current = width;
    pager.current?.scrollToOffset({ offset: currentPage.current * width, animated: false });
    // Reanimated shared values are intentionally aligned after a viewport resize.
    // eslint-disable-next-line react-hooks/immutability
    progress.value = currentPage.current;
    // eslint-disable-next-line react-hooks/immutability
    lastReportedIndex.value = currentPage.current;
  }, [lastReportedIndex, progress, width]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const page = event.contentOffset.x / width;
      // UI-thread scroll callbacks keep the highlight in sync without React frame updates.
      // eslint-disable-next-line react-hooks/immutability
      progress.value = page;
      const nearest = pageIndexAtOffset(event.contentOffset.x, width, tabs.length);
      if (nearest !== lastReportedIndex.value) {
        // eslint-disable-next-line react-hooks/immutability
        lastReportedIndex.value = nearest;
        runOnJS(reportVisibleIndex)(nearest);
      }
    },
  }, [reportVisibleIndex, width]);

  const onScrollEndDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    cancelSettle();
    const offsetX = event.nativeEvent.contentOffset.x;
    pendingSettle.current = setTimeout(() => settlePage(offsetX), 180);
  }, [cancelSettle, settlePage]);

  const onMomentumScrollBegin = useCallback(() => cancelSettle(), [cancelSettle]);
  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    cancelSettle();
    settlePage(event.nativeEvent.contentOffset.x);
  }, [cancelSettle, settlePage]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * cellWidth }],
  }), [cellWidth]);

  const renderPage = useCallback(({ item: index }: { item: number }) => {
    const Page = pages[index];
    return <View style={{ width, flex: 1 }}><Page /></View>;
  }, [width]);

  return <View style={{ flex: 1, backgroundColor: palette.canvas }}>
    <PageList
      ref={pager}
      data={[0, 1, 2, 3, 4]}
      renderItem={renderPage}
      keyExtractor={index => tabs[index].name}
      extraData={resolvedTheme}
      horizontal
      pagingEnabled
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      bounces={false}
      decelerationRate="fast"
      initialScrollIndex={initialIndex}
      getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={3}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollBegin={onMomentumScrollBegin}
      onMomentumScrollEnd={onMomentumScrollEnd}
      removeClippedSubviews
      style={{ flex: 1 }}
    />

    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 8) + 8, height: 72, padding: 6, borderRadius: 25, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 6, top: 6, bottom: 6, width: cellWidth, borderRadius: 19, backgroundColor: palette.purpleSoft }, indicatorStyle]} />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {tabs.map((tab, index) => <Pressable
          key={tab.name}
          accessibilityRole="tab"
          accessibilityState={{ selected: selectedIndex === index }}
          accessibilityLabel={tab.label}
          onPress={() => {
            if (pendingSettle.current) clearTimeout(pendingSettle.current);
            currentPage.current = index;
            setSelectedIndex(index);
            pager.current?.scrollToOffset({ offset: index * width, animated: true });
            pendingSettle.current = setTimeout(() => settlePage(index * width), 420);
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
