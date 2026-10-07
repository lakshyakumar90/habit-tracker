import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from './Primitives';
import { palette } from '../../theme/tokens';
import { dateKey } from '../../utils/dates';
import { useHabitlyTheme } from '../../features/app/AppProvider';

type CalendarProps={visible:boolean;value:string;title?:string;onClose:()=>void;onSelect:(date:string)=>void};
export function CalendarDialog(props:CalendarProps){return props.visible?<CalendarContent key={props.value} {...props}/>:null}
function CalendarContent({ visible, value, title = 'Choose a date', onClose, onSelect }: CalendarProps) {
  useHabitlyTheme();
  const selected = new Date(`${value}T12:00:00`);
  const [month, setMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: palette.overlay }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close calendar" onPress={onClose} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.duration(230)} style={{ backgroundColor: palette.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 16, maxHeight: '88%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View><Text style={{ color: palette.ink, fontSize: 20, fontWeight: '800' }}>{title}</Text><Text style={{ color: palette.muted, marginTop: 3 }}>{selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close calendar" onPress={onClose} style={closeButton()}><MaterialCommunityIcons name="close" size={21} color={palette.ink} /></Pressable></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={navButton()}><MaterialCommunityIcons name="chevron-left" size={24} color={palette.ink} /></Pressable><Text style={{ color: palette.ink, fontWeight: '700', fontSize: 16 }}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={navButton()}><MaterialCommunityIcons name="chevron-right" size={24} color={palette.ink} /></Pressable></View>
        <View style={{ flexDirection: 'row' }}>{['M','T','W','T','F','S','S'].map((d,i)=><Text key={`${d}${i}`} style={{ flex: 1, textAlign: 'center', color: palette.muted, fontSize: 12, fontWeight: '600', paddingVertical: 6 }}>{d}</Text>)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{days.map((day,i)=>{if(!day)return <View key={`empty${i}`} style={{ width: '14.285%', height: 44 }} />;const key=dateKey(day);const active=key===value;const today=key===dateKey();return <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={day.toLocaleDateString()} onPress={()=>{onSelect(key);onClose();}} style={{ width: '14.285%', height: 44, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:active?palette.purple:today?palette.purpleSoft:'transparent',borderWidth:today&&!active?1:0,borderColor:palette.purple }}><Text style={{ color:active?palette.onPrimary:palette.ink,fontWeight:active||today?'700':'500' }}>{day.getDate()}</Text></View></Pressable>;})}</View>
        <Button label="Today" secondary onPress={()=>{onSelect(dateKey());onClose();}} />
      </Animated.View>
    </View>
  </Modal>;
}

type TimeProps={visible:boolean;value:string;title?:string;onClose:()=>void;onSelect:(time:string)=>void};
export function TimeDialog(props:TimeProps){return props.visible?<TimePicker key={props.value} {...props}/>:null}
function TimePicker({ visible, value, title = 'Reminder time', onClose, onSelect }: TimeProps) {
  const { accent } = useHabitlyTheme();
  const [hour24,setHour24]=useState(()=>Number(value.split(':')[0] ?? 9));
  const [minute,setMinute]=useState(()=>Number(value.split(':')[1] ?? 0));
  const hour12=hour24%12||12;
  const period=hour24>=12?'PM':'AM';
  const hours=Array.from({length:12},(_,index)=>String(index+1).padStart(2,'0'));
  const minutes=Array.from({length:60},(_,index)=>String(index).padStart(2,'0'));
  const setHour12=(next:number)=>setHour24((next%12)+(period==='PM'?12:0));
  const setPeriod=(next:'AM'|'PM')=>setHour24((hour24%12)+(next==='PM'?12:0));
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}><View style={{flex:1,justifyContent:'flex-end',backgroundColor:palette.overlay}}><Pressable accessibilityRole="button" accessibilityLabel="Close time picker" onPress={onClose} style={StyleSheet.absoluteFill}/><Animated.View entering={FadeInUp.duration(230)} style={{backgroundColor:palette.canvas,borderTopLeftRadius:28,borderTopRightRadius:28,padding:22,paddingBottom:28,gap:17}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View><Text style={{color:palette.ink,fontSize:20,fontWeight:'800'}}>{title}</Text><Text style={{color:palette.muted,marginTop:3,fontSize:13}}>Choose hour, minute, and AM or PM</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close time picker" onPress={onClose} style={closeButton()}><MaterialCommunityIcons name="close" size={21} color={palette.ink}/></Pressable></View>
    <View style={{flexDirection:'row',justifyContent:'center',gap:10}}>
      <TimeWheel label="Hour" values={hours} selectedIndex={hour12-1} onSelect={index=>setHour12(index+1)} accent={accent}/>
      <TimeWheel label="Minute" values={minutes} selectedIndex={minute} onSelect={setMinute} accent={accent}/>
      <TimeWheel label="Period" values={['AM','PM']} selectedIndex={period==='AM'?0:1} onSelect={index=>setPeriod(index===0?'AM':'PM')} accent={accent}/>
    </View>
    <Text accessibilityLiveRegion="polite" style={{textAlign:'center',fontSize:15,fontWeight:'700',color:palette.ink}}>{String(hour12).padStart(2,'0')}:{String(minute).padStart(2,'0')} {period}</Text>
    <Button label="Set reminder" onPress={()=>{onSelect(`${String(hour24).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);onClose();}}/>
  </Animated.View></View></Modal>;
}

const WHEEL_ROW_HEIGHT=44;
function TimeWheel({label,values,selectedIndex,onSelect,accent}:{label:string;values:string[];selectedIndex:number;onSelect:(index:number)=>void;accent:string}){
  const scroll=useRef<ScrollView>(null);
  useEffect(()=>{scroll.current?.scrollTo({y:selectedIndex*WHEEL_ROW_HEIGHT,animated:false});},[selectedIndex]);
  const settle=(event:NativeSyntheticEvent<NativeScrollEvent>)=>onSelect(Math.max(0,Math.min(values.length-1,Math.round(event.nativeEvent.contentOffset.y/WHEEL_ROW_HEIGHT))));
  return <View style={{flex:1,minWidth:0,gap:7}}>
    <Text style={{textAlign:'center',fontSize:11,fontWeight:'700',letterSpacing:.6,color:palette.muted}}>{label}</Text>
    <View style={{height:WHEEL_ROW_HEIGHT*5,borderRadius:18,backgroundColor:palette.surfaceSoft,overflow:'hidden'}}>
      <View pointerEvents="none" style={{position:'absolute',top:WHEEL_ROW_HEIGHT*2,left:4,right:4,height:WHEEL_ROW_HEIGHT,borderRadius:12,backgroundColor:palette.purpleSoft,borderWidth:1,borderColor:accent}}/>
      <ScrollView ref={scroll} style={{zIndex:1}} nestedScrollEnabled showsVerticalScrollIndicator={false} snapToInterval={WHEEL_ROW_HEIGHT} decelerationRate="fast" contentOffset={{x:0,y:selectedIndex*WHEEL_ROW_HEIGHT}} contentContainerStyle={{paddingVertical:WHEEL_ROW_HEIGHT*2}} onMomentumScrollEnd={settle} onScrollEndDrag={event=>{if(Math.abs(event.nativeEvent.velocity?.y??0)<0.01)settle(event);}} accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{text:values[selectedIndex]}} accessibilityActions={[{name:'increment'},{name:'decrement'}]} onAccessibilityAction={event=>onSelect(Math.max(0,Math.min(values.length-1,selectedIndex+(event.nativeEvent.actionName==='increment'?1:-1))))}>
        {values.map((item,index)=><Pressable key={`${label}-${item}`} accessibilityRole="button" accessibilityLabel={`${label} ${item}`} onPress={()=>{onSelect(index);scroll.current?.scrollTo({y:index*WHEEL_ROW_HEIGHT,animated:true});}} style={{height:WHEEL_ROW_HEIGHT,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:selectedIndex===index?21:17,fontWeight:selectedIndex===index?'800':'500',color:selectedIndex===index?accent:palette.muted}}>{item}</Text></Pressable>)}
      </ScrollView>
    </View>
  </View>;
}

const closeButton=()=>({width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:palette.surfaceSoft} as const);
const navButton=()=>({width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:palette.surfaceSoft} as const);
