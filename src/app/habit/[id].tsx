import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CalendarDialog } from '../../components/ui/DateTimeDialogs';
import { Card, Header, IconButton, ProgressBar, Screen } from '../../components/ui/Primitives';
import { useHabitly } from '../../features/app/AppProvider';
import { calculateLongestStreak, calculateStreak, scheduledCompletionRate, heatmapLevel, isScheduledOn } from '../../features/habits/domain';
import { palette } from '../../theme/tokens';
import { addDays, dateKey } from '../../utils/dates';

export default function HabitDetail(){
  const {id}=useLocalSearchParams<{id:string}>();
  const {habits,entries,setEntry}=useHabitly();
  const habit=habits.find(h=>h.id===id);
  const [calendarOpen,setCalendarOpen]=useState(false);
  const [selectedDate,setSelectedDate]=useState(dateKey());
  const weeks=useMemo(()=>{
    const today=new Date();const end=new Date(today);end.setDate(end.getDate()+((7-end.getDay())%7));
    const first=addDays(end,-52*7);first.setDate(first.getDate()-((first.getDay()+6)%7));
    return Array.from({length:53},(_,w)=>Array.from({length:7},(_,d)=>{const date=addDays(first,w*7+d);const key=dateKey(date);const entry=entries.find(e=>e.habitId===id&&e.date===key);return {date,key,level:habit?heatmapLevel(entry,habit):0};}));
  },[entries,id,habit]);
  const monthLabels=useMemo(()=>{let last='';return weeks.map((week,index)=>{const m=week[0].date.toLocaleDateString(undefined,{month:'short'});if(m!==last){last=m;return {index,label:m};}return null;}).filter(Boolean) as {index:number;label:string}[]},[weeks]);
  if(!habit)return <Screen><Header title="Habit not found" right={<IconButton icon="arrow-left" accessibilityLabel="Go back" onPress={()=>router.back()}/>} /></Screen>;
  const streak=calculateStreak(habit,entries);const longest=calculateLongestStreak(habit,entries);const rate=scheduledCompletionRate(habit,entries);const colors=[palette.heat0,palette.heat1,palette.heat2,palette.heat3,palette.heat4];
  const savePastDate=(key:string)=>{const done=entries.some(e=>e.habitId===habit.id&&e.date===key&&e.completed);void setEntry(habit,done?0:habit.target,key);};
  return <Screen>
    <Header title="Habit details" right={<IconButton icon="arrow-left" accessibilityLabel="Go back" onPress={()=>router.back()}/>} />
    <View style={{flexDirection:'row',alignItems:'center',gap:14}}><View style={{width:62,height:62,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:habit.color+'35'}}><Text style={{fontSize:32}}>{habit.icon}</Text></View><View style={{flex:1}}><Text style={{fontSize:23,fontWeight:'800',color:palette.ink}}>{habit.name}</Text><Text style={{color:palette.muted,marginTop:4}}>{habit.schedule.length===7?'Every day':`${habit.schedule.length} days a week`}{habit.reminderAt?` · ${habit.reminderAt}`:''}</Text></View></View>
    <View style={{flexDirection:'row',gap:10}}>{[[`${streak} days`,'Current streak','fire'],[`${longest} days`,'Longest streak','trophy-outline']].map(([n,l,icon])=><Card key={l} style={{flex:1,gap:7}}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={l==='Current streak'?palette.yellow:palette.purple}/><Text style={{fontSize:23,fontWeight:'800',color:palette.ink}}>{n}</Text><Text style={{fontSize:12,color:palette.muted}}>{l}</Text></Card>)}</View>
    <Card style={{gap:10}}><Text style={{fontWeight:'800',color:palette.ink}}>Completion rate</Text><View style={{flexDirection:'row',alignItems:'center',gap:12}}><Text style={{fontSize:28,fontWeight:'800',color:palette.ink}}>{rate}%</Text><View style={{flex:1}}><ProgressBar value={rate} color={habit.color}/></View></View></Card>
    <Card style={{gap:13}}><View><Text style={{fontWeight:'800',color:palette.ink}}>Consistency calendar</Text><Text style={{fontSize:12,color:palette.muted,marginTop:4}}>Tap a day to open its month and update history.</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false}><View><View style={{height:22,flexDirection:'row'}}>{monthLabels.map(m=><Text key={m.index} style={{position:'absolute',left:m.index*14,fontSize:10,color:palette.muted}}>{m.label}</Text>)}</View><View style={{flexDirection:'row',gap:3}}>{weeks.map((week,i)=><View key={i} style={{gap:3}}>{week.map(day=><Pressable key={day.key} accessibilityRole="button" accessibilityLabel={`${day.key}, ${day.level?'completed':'not completed'}. Open month calendar`} onPress={()=>{setSelectedDate(day.key);setCalendarOpen(true)}} style={{width:11,height:11,borderRadius:3,backgroundColor:colors[day.level],opacity:isScheduledOn(habit,day.date)?1:.45}} />)}</View>)}</View></View></ScrollView><View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:5}}><Text style={{fontSize:10,color:palette.muted}}>Less</Text>{colors.map((color,i)=><View key={i} style={{width:10,height:10,borderRadius:3,backgroundColor:color}}/>)}<Text style={{fontSize:10,color:palette.muted}}>More</Text></View></Card>
    <Card style={{gap:11}}><Text style={{fontWeight:'800',color:palette.ink}}>Schedule</Text><View style={{flexDirection:'row',justifyContent:'space-between'}}>{['S','M','T','W','T','F','S'].map((d,i)=><View key={`${d}${i}`} style={{width:32,height:32,borderRadius:16,backgroundColor:habit.schedule.includes(i)?palette.purpleSoft:palette.surfaceSoft,alignItems:'center',justifyContent:'center'}}><Text style={{fontWeight:'700',color:habit.schedule.includes(i)?palette.purple:palette.muted}}>{d}</Text></View>)}</View><Text style={{fontSize:12,color:palette.muted}}>Streaks only advance on these scheduled days.</Text></Card>
    <CalendarDialog visible={calendarOpen} value={selectedDate} title="Update habit history" onClose={()=>setCalendarOpen(false)} onSelect={savePastDate}/>
  </Screen>;
}
