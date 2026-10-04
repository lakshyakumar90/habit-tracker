import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../../theme/tokens';
import { useHabitly } from '../../features/app/AppProvider';

export function Screen({children,style,safeBottom=true}:{children:React.ReactNode;style?:ViewStyle;safeBottom?:boolean}) {
  useHabitly();
  const progress=useSharedValue(0);
  // Reanimated shared values intentionally reset and spring when a tab gains focus.
  // eslint-disable-next-line react-hooks/immutability
  useFocusEffect(useCallback(()=>{progress.value=0;progress.value=withSpring(1,{damping:20,stiffness:150});return()=>{}},[progress]));
  const motion=useAnimatedStyle(()=>({opacity:progress.value,transform:[{translateY:(1-progress.value)*9}]}));
  const edges=safeBottom?['top','bottom','left','right'] as const:['top','left','right'] as const;
  return <SafeAreaView edges={edges} style={{flex:1,backgroundColor:palette.canvas}}><Animated.ScrollView style={[{flex:1},motion]} contentContainerStyle={[styles.screen,!safeBottom&&{paddingBottom:104},style]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</Animated.ScrollView></SafeAreaView>;
}

export function Card({children,style}:{children:React.ReactNode;style?:ViewStyle}) {
  useHabitly();
  return <Animated.View entering={FadeInDown.duration(220)} style={[styles.card,{backgroundColor:palette.card,borderColor:palette.line},style]}>{children}</Animated.View>;
}
export function SectionTitle({children,aside}:{children:string;aside?:React.ReactNode}) {
  useHabitly();
  return <View style={styles.section}><Text style={[styles.sectionText,{color:palette.ink}]}>{children}</Text>{aside}</View>;
}
export function Button({label,onPress,secondary,style}:{label:string;onPress:()=>void;secondary?:boolean;style?:ViewStyle}) {
  useHabitly();
  const scale=useSharedValue(1);const motion=useAnimatedStyle(()=>({transform:[{scale:scale.value}]}));
  // Reanimated shared values are intentionally updated from press callbacks.
  // eslint-disable-next-line react-hooks/immutability
  const pressIn=()=>{scale.value=withSpring(.97)};
  // eslint-disable-next-line react-hooks/immutability
  const pressOut=()=>{scale.value=withSpring(1)};
  return <Animated.View style={[style,motion]}><Pressable accessibilityRole="button" onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[styles.button,{backgroundColor:secondary?palette.purpleSoft:palette.purple}]}><Text style={[styles.buttonText,{color:secondary?palette.purple:palette.onPrimary}]}>{label}</Text></Pressable></Animated.View>;
}
export function IconButton({icon,onPress,accessibilityLabel}:{icon:string;onPress:()=>void;accessibilityLabel:string}) {
  useHabitly();
  const scale=useSharedValue(1);const motion=useAnimatedStyle(()=>({transform:[{scale:scale.value}]}));
  // Reanimated shared values are intentionally updated from press callbacks.
  // eslint-disable-next-line react-hooks/immutability
  const pressIn=()=>{scale.value=withSpring(.88)};
  // eslint-disable-next-line react-hooks/immutability
  const pressOut=()=>{scale.value=withSpring(1)};
  return <Animated.View style={motion}><Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[styles.iconButton,{backgroundColor:palette.purpleSoft}]}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={palette.ink}/></Pressable></Animated.View>;
}
export function Header({title,subtitle,right}:{title:string;subtitle?:string;right?:React.ReactNode}) {
  useHabitly();
  return <View style={styles.header}><View style={{flex:1}}><Text style={[styles.title,{color:palette.ink}]}>{title}</Text>{subtitle&&<Text style={[styles.subtitle,{color:palette.muted}]}>{subtitle}</Text>}</View>{right}</View>;
}
export function ProgressBar({value,color=palette.purple}:{value:number;color?:string}) {
  useHabitly();
  return <View style={[styles.track,{backgroundColor:palette.line}]}><View style={[styles.fill,{width:`${Math.max(0,Math.min(100,value))}%`,backgroundColor:color}]}/></View>;
}
const styles=StyleSheet.create({screen:{paddingHorizontal:20,paddingTop:12,paddingBottom:14,gap:16} as ViewStyle,card:{borderRadius:18,padding:16,borderWidth:1} as ViewStyle,section:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:-6} as ViewStyle,sectionText:{fontSize:17,fontWeight:'700'} as TextStyle,button:{borderRadius:16,minHeight:48,alignItems:'center',justifyContent:'center',paddingHorizontal:20} as ViewStyle,buttonText:{fontSize:15,fontWeight:'700'} as TextStyle,iconButton:{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center'} as ViewStyle,header:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:0} as ViewStyle,title:{fontSize:25,fontWeight:'700',letterSpacing:-.35} as TextStyle,subtitle:{fontSize:14,marginTop:4} as TextStyle,track:{height:8,borderRadius:8,overflow:'hidden'} as ViewStyle,fill:{height:'100%',borderRadius:8} as ViewStyle});
