import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from './Primitives';
import { palette } from '../../theme/tokens';
import { dateKey } from '../../utils/dates';

type CalendarProps={visible:boolean;value:string;title?:string;onClose:()=>void;onSelect:(date:string)=>void};
export function CalendarDialog(props:CalendarProps){return props.visible?<CalendarContent key={props.value} {...props}/>:null}
function CalendarContent({ visible, value, title = 'Choose a date', onClose, onSelect }: CalendarProps) {
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
  const [hour,setHour]=useState(value.split(':')[0]||'09');const [minute,setMinute]=useState(value.split(':')[1]||'00');
  const bounded=(raw:string,max:number)=>{const clean=raw.replace(/\D/g,'').slice(0,2);return clean===''?clean:String(Math.min(max,Number(clean))).padStart(2,'0')};
  const delta=(part:'hour'|'minute',amount:number)=>{const num=Number(part==='hour'?hour:minute);const next=part==='hour'?(num+amount+24)%24:(num+amount+60)%60;(part==='hour'?setHour:setMinute)(String(next).padStart(2,'0'));};
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}><View style={{flex:1,justifyContent:'flex-end',backgroundColor:palette.overlay}}><Animated.View entering={FadeInUp.duration(230)} style={{backgroundColor:palette.canvas,borderTopLeftRadius:28,borderTopRightRadius:28,padding:22,gap:18}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View><Text style={{color:palette.ink,fontSize:20,fontWeight:'800'}}>{title}</Text><Text style={{color:palette.muted,marginTop:3}}>Choose any hour and minute</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close time picker" onPress={onClose} style={closeButton()}><MaterialCommunityIcons name="close" size={21} color={palette.ink}/></Pressable></View>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10}}>{([['hour',hour],['minute',minute]] as const).map(([part,val])=><View key={part} style={{alignItems:'center',gap:8}}><Pressable accessibilityLabel={`Increase ${part}`} onPress={()=>delta(part,part==='hour'?1:5)} style={navButton()}><MaterialCommunityIcons name="chevron-up" size={24} color={palette.ink}/></Pressable><TextInput accessibilityLabel={part} value={val} onChangeText={raw=>(part==='hour'?setHour:setMinute)(bounded(raw,part==='hour'?23:59))} keyboardType="number-pad" maxLength={2} selectTextOnFocus style={{width:86,height:64,borderRadius:18,backgroundColor:palette.input,color:palette.ink,fontSize:29,fontWeight:'800',textAlign:'center'}}/><Text style={{color:palette.muted,fontSize:12}}>{part==='hour'?'HOUR':'MINUTE'}</Text><Pressable accessibilityLabel={`Decrease ${part}`} onPress={()=>delta(part,part==='hour'?-1:-5)} style={navButton()}><MaterialCommunityIcons name="chevron-down" size={24} color={palette.ink}/></Pressable></View>)}<Text style={{fontSize:32,fontWeight:'800',color:palette.muted,marginBottom:22}}>:</Text><Text style={{fontSize:14,fontWeight:'700',color:palette.ink,marginBottom:22}}>24H</Text></View>
    <Button label="Set reminder" onPress={()=>{onSelect(`${String(Number(hour)||0).padStart(2,'0')}:${String(Number(minute)||0).padStart(2,'0')}`);onClose();}}/>
  </Animated.View></View></Modal>;
}

const closeButton=()=>({width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:palette.surfaceSoft} as const);
const navButton=()=>({width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:palette.surfaceSoft} as const);
