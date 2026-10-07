import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useHabitlyProfile, useHabitlyStatus, useHabitlyTheme } from '../features/app/AppProvider';
import { palette } from '../theme/tokens';
import { appRoute } from '../utils/routes';
export default function Index(){useHabitlyTheme();const {ready}=useHabitlyStatus();const {onboardingComplete,onboardingDraft}=useHabitlyProfile();if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.canvas}}><ActivityIndicator color={palette.purple}/></View>;const profileNeedsSetup=!onboardingDraft.ageRange||!onboardingDraft.discoverySource;return <Redirect href={appRoute(onboardingComplete&&!profileNeedsSetup?'/(tabs)/today':'/welcome')}/>;}
