import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { appRoute } from '../../utils/routes';

export type ReturnTab = 'today' | 'habits' | 'stats';

function returnHref(value: string | string[] | undefined) {
  const tab = Array.isArray(value) ? value[0] : value;
  if (tab === 'today') return appRoute('/(tabs)/today');
  if (tab === 'habits') return appRoute('/(tabs)/habits');
  if (tab === 'stats') return appRoute('/(tabs)/stats');
  return null;
}

export function useReturnToTab(from: string | string[] | undefined) {
  const goBack = useCallback(() => {
    const href = returnHref(from);
    if (href) router.dismissTo(href);
    else if (router.canGoBack()) router.back();
    else router.replace(appRoute('/(tabs)/today'));
  }, [from]);

  useFocusEffect(useCallback(() => {
    if (!returnHref(from)) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [from, goBack]));

  return goBack;
}
