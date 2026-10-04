import { useCallback, useMemo, useState } from 'react';
import { Modal, PanResponder, Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from './Primitives';
import { palette } from '../../theme/tokens';
import { dateKey } from '../../utils/dates';
import { useHabitly } from '../../features/app/AppProvider';

type CalendarProps={visible:boolean;value:string;title?:string;onClose:()=>void;onSelect:(date:string)=>void};
export function CalendarDialog(props:CalendarProps){return props.visible?<CalendarContent key={props.value} {...props}/>:null}
function CalendarContent({ visible, value, title = 'Choose a date', onClose, onSelect }: CalendarProps) {
  useHabitly();
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
  useHabitly();
  const [hour24,setHour24]=useState(()=>Number(value.split(':')[0]||9));
  const [minute,setMinute]=useState(()=>Number(value.split(':')[1]||0));
  const hour12=hour24%12||12;
  const period=hour24>=12?'PM':'AM';
  const setHour12=(next:number)=>setHour24((next%12)+(period==='PM'?12:0));
  const setPeriod=(next:'AM'|'PM')=>setHour24((hour24%12)+(next==='PM'?12:0));
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}><View style={{flex:1,justifyContent:'flex-end',backgroundColor:palette.overlay}}><Animated.View entering={FadeInUp.duration(230)} style={{backgroundColor:palette.canvas,borderTopLeftRadius:28,borderTopRightRadius:28,padding:22,paddingBottom:28,gap:17}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View><Text style={{color:palette.ink,fontSize:20,fontWeight:'800'}}>{title}</Text><Text style={{color:palette.muted,marginTop:3,fontSize:13}}>Set any time of day</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close time picker" onPress={onClose} style={closeButton()}><MaterialCommunityIcons name="close" size={21} color={palette.ink}/></Pressable></View>
    <View style={{alignItems:'center',gap:14}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:5}}><Text style={{fontSize:40,fontWeight:'800',letterSpacing:-1,color:palette.ink}}>{hour12}</Text><Text style={{fontSize:38,fontWeight:'700',color:palette.muted}}>:</Text><Text style={{fontSize:40,fontWeight:'800',letterSpacing:-1,color:palette.ink}}>{String(minute).padStart(2,'0')}</Text><View style={{marginLeft:6,gap:4}}>{(['AM','PM'] as const).map(item=><Pressable key={item} accessibilityRole="button" accessibilityState={{selected:period===item}} onPress={()=>setPeriod(item)} style={{paddingHorizontal:11,paddingVertical:6,borderRadius:10,backgroundColor:period===item?palette.purple:palette.surfaceSoft}}><Text style={{fontSize:12,fontWeight:'800',color:period===item?palette.onPrimary:palette.muted}}>{item}</Text></Pressable>)}</View></View>
      <TimeSlider label="HOUR" value={hour12} min={1} max={12} onChange={setHour12}/>
      <TimeSlider label="MINUTE" value={minute} min={0} max={59} onChange={setMinute}/>
    </View>
    <Button label="Set reminder" onPress={()=>{onSelect(`${String(hour24).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);onClose();}}/>
  </Animated.View></View></Modal>;
}

function TimeSlider({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(value:number)=>void}){
  const [width,setWidth]=useState(1);
  const setFromX=useCallback((x:number)=>onChange(Math.min(max,Math.max(min,Math.round((Math.max(0,Math.min(width,x))/width)*(max-min)+min)))),[onChange,width,min,max]);
  const pan=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderGrant:e=>setFromX(e.nativeEvent.locationX),onPanResponderMove:e=>setFromX(e.nativeEvent.locationX)}),[setFromX]);
  const ratio=(value-min)/(max-min);
  const marks=label==='HOUR'?['1','4','7','10','12']:['00','15','30','45','59'];
  return <View style={{width:'100%',gap:7}}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{fontSize:11,fontWeight:'700',letterSpacing:.8,color:palette.muted}}>{label}</Text><Text style={{fontSize:11,color:palette.muted}}>{label==='HOUR'?'1–12':'00–59'}</Text></View><View accessibilityRole="adjustable" accessibilityLabel={`${label.toLowerCase()} slider`} accessibilityValue={{min,max,now:value}} accessibilityActions={[{name:'increment'},{name:'decrement'}]} onAccessibilityAction={e=>onChange(Math.max(min,Math.min(max,value+(e.nativeEvent.actionName==='increment'?1:-1))))} onLayout={e=>setWidth(e.nativeEvent.layout.width)} {...pan.panHandlers} style={{height:42,justifyContent:'center',paddingHorizontal:6}}><View style={{height:7,borderRadius:5,backgroundColor:palette.line,overflow:'visible'}}><View style={{width:`${ratio*100}%`,height:7,borderRadius:5,backgroundColor:palette.purple}}/><View style={{position:'absolute',left:`${ratio*100}%`,top:-8,marginLeft:-12,width:24,height:24,borderRadius:12,backgroundColor:palette.purple,borderWidth:3,borderColor:palette.canvas,elevation:2}}/></View></View><View style={{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:4}}>{marks.map(mark=><Text key={mark} style={{fontSize:10,color:palette.muted}}>{mark}</Text>)}</View></View>;
}

const closeButton=()=>({width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:palette.surfaceSoft} as const);
const navButton=()=>({width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:palette.surfaceSoft} as const);
