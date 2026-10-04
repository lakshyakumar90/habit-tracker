import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useHabitly } from '../features/app/AppProvider';
import { palette } from '../theme/tokens';
export default function Index(){const {ready,onboardingComplete}=useHabitly();if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.canvas}}><ActivityIndicator color={palette.purple}/></View>;return <Redirect href={onboardingComplete?'/(tabs)/today':'/welcome'}/>;}
