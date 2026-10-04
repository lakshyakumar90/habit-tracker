import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useHabitly } from '../../features/app/AppProvider';
import { palette } from '../../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { useCallback, useEffect } from 'react';
import { usePathname, router, type Href } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const icons = {
  today: { active: 'view-dashboard', inactive: 'view-dashboard-outline' },
  habits: { active: 'sprout', inactive: 'sprout-outline' },
  tasks: { active: 'checkbox-marked-circle', inactive: 'checkbox-blank-circle-outline' },
  stats: { active: 'chart-box', inactive: 'chart-box-outline' },
  profile: { active: 'account', inactive: 'account-outline' },
} as const;

export default function TabLayout() {
  useHabitly(); // Theme changes update the native tab bar immediately.
  const insets=useSafeAreaInsets();
  const {width}=useWindowDimensions();
  const pathname=usePathname();
  const offset=useSharedValue(0);
  const currentIndex=Math.max(0,Object.keys(icons).findIndex(name=>pathname.endsWith(`/${name}`)));
  const changeTab=useCallback((index:number,direction:number)=>{
    const paths:Href[]=['/(tabs)/today','/(tabs)/habits','/(tabs)/tasks','/(tabs)/stats','/(tabs)/profile'];
    // Reanimated shared values are intentionally updated from navigation callbacks.
    // eslint-disable-next-line react-hooks/immutability
    offset.value=-direction*width;
    router.navigate(paths[index]);
    requestAnimationFrame(()=>{offset.value=withTiming(0,{duration:190});});
  },[offset,width]);
  const swipe=Gesture.Pan()
    .activeOffsetX([-42,42])
    .failOffsetY([-18,18])
    .onUpdate(event=>{
      // eslint-disable-next-line react-hooks/immutability
      offset.value=Math.max(-44,Math.min(44,event.translationX*.18));
    })
    .onEnd(event=>{
      const dx=event.translationX;
      const nextIndex=dx < -58 || event.velocityX < -650 ? currentIndex+1 : dx > 58 || event.velocityX > 650 ? currentIndex-1 : currentIndex;
      if(nextIndex!==currentIndex&&nextIndex>=0&&nextIndex<Object.keys(icons).length){
        const direction=nextIndex>currentIndex?-1:1;
        // Gesture completion intentionally drives the tab exit animation.
        // eslint-disable-next-line react-hooks/immutability
        offset.value=withTiming(direction*width,{duration:130},finished=>{if(finished)runOnJS(changeTab)(nextIndex,direction);});
      } else {
        offset.value=withTiming(0,{duration:160});
      }
    });
  const swipeMotion=useAnimatedStyle(()=>({transform:[{translateX:offset.value}]}));
  return (
    <GestureDetector gesture={swipe}>
    <Animated.View style={[{flex:1},swipeMotion]}>
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: palette.purple,
      tabBarInactiveTintColor: palette.tabInactive,
      tabBarStyle: { position:'absolute', left:16, right:16, bottom:Math.max(insets.bottom,8)+8, height:72, paddingTop:10, paddingBottom:10, borderRadius:25, borderTopWidth:0, borderWidth:1, borderColor:palette.line, backgroundColor:palette.card, elevation:8, shadowColor:'#000', shadowOpacity:.1, shadowRadius:14, shadowOffset:{width:0,height:5} },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      tabBarIconStyle: { marginTop: 1 },
    }}>
      {Object.entries(icons).map(([name, pair]) => (
        <Tabs.Screen key={name} name={name} options={{
          title: name[0].toUpperCase() + name.slice(1),
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon name={focused ? pair.active : pair.inactive} color={color} focused={focused} />,
        }} />
      ))}
    </Tabs>
    </Animated.View>
    </GestureDetector>
  );
}

function AnimatedTabIcon({name,color,focused}:{name:string;color:string|import('react-native').ColorValue;focused:boolean}){const scale=useSharedValue(focused?1.04:1);useEffect(()=>{scale.value=withTiming(focused?1.04:1,{duration:160})},[focused,scale]);const motion=useAnimatedStyle(()=>({transform:[{scale:scale.value}]}));return <Animated.View style={[{width:38,height:34,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:focused?palette.purpleSoft:'transparent'},motion]}><MaterialCommunityIcons name={name as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={color}/></Animated.View>}
