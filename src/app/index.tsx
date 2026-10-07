import { Redirect } from 'expo-router';
import { ActivityIndicator, Image, View } from 'react-native';
import { useHabitlyProfile, useHabitlyStatus, useHabitlyTheme } from '../features/app/AppProvider';
import { palette } from '../theme/tokens';
import { appRoute } from '../utils/routes';
export default function Index(){useHabitlyTheme();const {ready}=useHabitlyStatus();const {onboardingComplete,onboardingDraft}=useHabitlyProfile();if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',gap:18,backgroundColor:palette.canvas}}><Image source={require('../../assets/images/habitly-mark.png')} accessibilityLabel="Habitly logo" style={{width:88,height:88}} resizeMode="contain" /><ActivityIndicator color={palette.purple}/></View>;const profileNeedsSetup=!onboardingDraft.ageRange||!onboardingDraft.discoverySource;return <Redirect href={appRoute(onboardingComplete&&!profileNeedsSetup?'/(tabs)/today':'/welcome')}/>;}
