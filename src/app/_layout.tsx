import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useHabitly } from '../features/app/AppProvider';
import '../global.css';
function Routes(){ const {theme}=useHabitly(); return <><StatusBar style={theme==='dark'?'light':'dark'} /><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:'#F8F7FC'}}}><Stack.Screen name="index"/><Stack.Screen name="welcome"/><Stack.Screen name="(tabs)"/><Stack.Screen name="habit/[id]" options={{presentation:'card'}}/><Stack.Screen name="search"/></Stack></>; }
export default function RootLayout(){return <AppProvider><Routes/></AppProvider>;}
