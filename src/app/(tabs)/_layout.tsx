import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useHabitly } from '../../features/app/AppProvider';
import { palette } from '../../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const icons = {
  today: { active: 'view-dashboard', inactive: 'view-dashboard-outline' },
  habits: { active: 'sprout', inactive: 'sprout-outline' },
  tasks: { active: 'checkbox-marked-circle', inactive: 'checkbox-blank-circle-outline' },
  stats: { active: 'chart-box', inactive: 'chart-box-outline' },
} as const;

export default function TabLayout() {
  useHabitly(); // Theme changes update the native tab bar immediately.
  const insets=useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: palette.purple,
      tabBarInactiveTintColor: palette.tabInactive,
      tabBarStyle: { position:'absolute', left:16, right:16, bottom:Math.max(insets.bottom,8)+8, height:64, paddingTop:7, paddingBottom:5, borderRadius:23, borderTopWidth:0, borderWidth:1, borderColor:palette.line, backgroundColor:palette.card, elevation:8, shadowColor:'#000', shadowOpacity:.1, shadowRadius:14, shadowOffset:{width:0,height:5} },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
      tabBarIconStyle: { marginTop: 1 },
    }}>
      {Object.entries(icons).map(([name, pair]) => (
        <Tabs.Screen key={name} name={name} options={{
          title: name[0].toUpperCase() + name.slice(1),
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon name={focused ? pair.active : pair.inactive} color={color} focused={focused} />,
        }} />
      ))}
    </Tabs>
  );
}

function AnimatedTabIcon({name,color,focused}:{name:string;color:string|import('react-native').ColorValue;focused:boolean}){const scale=useSharedValue(focused?1.08:1);useEffect(()=>{scale.value=withSpring(focused?1.08:1,{damping:14,stiffness:180})},[focused,scale]);const motion=useAnimatedStyle(()=>({transform:[{scale:scale.value}]}));return <Animated.View style={motion}><MaterialCommunityIcons name={name as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={color}/></Animated.View>}
