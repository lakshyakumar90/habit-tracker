import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { palette } from '../../theme/tokens';
import { useHabitly } from '../../features/app/AppProvider';

export type SheetAction = { label:string; icon:string; destructive?:boolean; onPress:()=>void };
export function ActionSheet({visible,title,subtitle,actions,onClose}:{visible:boolean;title:string;subtitle?:string;actions:SheetAction[];onClose:()=>void}){
  useHabitly();
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}><View style={{flex:1,justifyContent:'flex-end',backgroundColor:palette.overlay}}><Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={onClose} style={StyleSheet.absoluteFill}/><Animated.View entering={FadeInUp.duration(220)} style={{backgroundColor:palette.canvas,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,paddingBottom:28,gap:10}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:4}}><View style={{flex:1,paddingRight:12}}><Text numberOfLines={1} style={{fontSize:19,fontWeight:'800',color:palette.ink}}>{title}</Text>{subtitle&&<Text style={{fontSize:13,color:palette.muted,marginTop:3}}>{subtitle}</Text>}</View><Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={onClose} style={{width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:palette.surfaceSoft}}><MaterialCommunityIcons name="close" size={21} color={palette.ink}/></Pressable></View>
    {actions.map(action=><Pressable key={action.label} accessibilityRole="button" onPress={()=>{onClose();action.onPress()}} style={({pressed})=>({minHeight:52,borderRadius:16,paddingHorizontal:15,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:pressed?palette.purpleSoft:palette.card,borderColor:palette.line,borderWidth:1})}><MaterialCommunityIcons name={action.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={action.destructive?palette.danger:palette.ink}/><Text style={{fontSize:15,fontWeight:'600',color:action.destructive?palette.danger:palette.ink}}>{action.label}</Text></Pressable>)}
  </Animated.View></View></Modal>;
}
