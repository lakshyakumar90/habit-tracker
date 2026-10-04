import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useHabitly } from '../features/app/AppProvider';
import { palette } from '../theme/tokens';
import '../global.css';
function Routes(){ const {theme}=useHabitly();const system=useColorScheme(); const dark=theme==='dark'||(theme==='system'&&system==='dark');return <><StatusBar style={dark?'light':'dark'} /><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:palette.canvas}}}><Stack.Screen name="index"/><Stack.Screen name="welcome"/><Stack.Screen name="onboarding"/><Stack.Screen name="(tabs)"/><Stack.Screen name="habit/[id]" options={{presentation:'card'}}/><Stack.Screen name="task/[id]" options={{presentation:'card'}}/><Stack.Screen name="statistics/[id]" options={{presentation:'card'}}/><Stack.Screen name="statistics/history/[id]" options={{presentation:'card'}}/><Stack.Screen name="achievements" options={{presentation:'card'}}/><Stack.Screen name="achievements/streak" options={{presentation:'card'}}/><Stack.Screen name="search"/><Stack.Screen name="settings"/></Stack></>; }
export default function RootLayout(){return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><AppProvider><Routes/></AppProvider></SafeAreaProvider></GestureHandlerRootView>;}
