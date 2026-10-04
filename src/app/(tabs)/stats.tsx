import { Text, View } from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card, Header, IconButton, ProgressBar, Screen } from '../../components/ui/Primitives';
import { useHabitly } from '../../features/app/AppProvider';
import { calculateLongestStreak, calculateStreak, isScheduledOn } from '../../features/habits/domain';
import { bestWeekday, weeklyCompletion } from '../../features/statistics/calculations';
import { palette } from '../../theme/tokens';
import { addDays, dateKey } from '../../utils/dates';
import { appRoute } from '../../utils/routes';

export default function Stats(){
  const {habits,entries}=useHabitly();
  const active=habits.filter(h=>!h.archived);
  const current=Math.max(0,...active.map(h=>calculateStreak(h,entries)));
  const longest=Math.max(0,...active.map(h=>calculateLongestStreak(h,entries)));
  const total=entries.filter(e=>e.completed).length;
  const week=weeklyCompletion(active,entries);
  const today=new Date();
  const monthStart=new Date(today.getFullYear(),today.getMonth(),1);
  const weekStarts:Date[]=[];
  for(let d=new Date(monthStart);d<=today;d=addDays(d,7))weekStarts.push(d);
  const monthValues=weekStarts.map(start=>{
    const end=addDays(start,6);let due=0,done=0;
    for(let d=new Date(start);d<=end&&d<=today;d=addDays(d,1))for(const h of active){if(!isScheduledOn(h,d))continue;due++;if(entries.some(e=>e.habitId===h.id&&e.date===dateKey(d)&&e.completed))done++;}
    return due?Math.round(done/due*100):0;
  });
  const month=monthValues.length?Math.round(monthValues.reduce((a,b)=>a+b,0)/monthValues.length):0;
  const metrics=[{value:String(current),label:'Current streak',icon:'fire',color:palette.yellow},{value:String(longest),label:'Longest streak',icon:'trophy-outline',color:palette.purple},{value:String(total),label:'Completed days',icon:'check-circle-outline',color:palette.success},{value:bestWeekday(active,entries),label:'Best weekday',icon:'calendar-star',color:palette.purple}];
  return <Screen safeBottom={false}>
    <Header title="Your progress" subtitle="Every small win adds up." right={<IconButton icon="cog-outline" accessibilityLabel="Settings" onPress={()=>router.push(appRoute('/settings'))}/>}/>
    <Card style={{gap:13}}><View style={{flexDirection:'row',alignItems:'center',gap:9}}><MaterialCommunityIcons name="chart-timeline-variant" size={20} color={palette.purple}/><Text style={{fontWeight:'700',color:palette.ink}}>Overall consistency</Text></View><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontSize:36,fontWeight:'900',color:palette.ink}}>{week}%</Text><View style={{flexDirection:'row',alignItems:'flex-end',gap:6,height:54}}>{[38,60,47,78,54,90,week].map((h,i)=><View key={i} style={{width:17,height:Math.max(5,h/1.8),borderRadius:7,backgroundColor:i===6?palette.purple:palette.purpleSoft}}/>)}</View></View><ProgressBar value={week}/><Text style={{fontSize:12,lineHeight:18,color:palette.muted}}>Completed scheduled habit check-ins ÷ scheduled check-ins so far this week.</Text></Card>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>{metrics.map(m=><Card key={m.label} style={{width:'48%',flexGrow:1,gap:7}}><MaterialCommunityIcons name={m.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={21} color={m.color}/><Text numberOfLines={1} style={{fontSize:24,fontWeight:'900',color:palette.ink}}>{m.value}</Text><Text style={{fontSize:12,color:palette.muted}}>{m.label}</Text></Card>)}</View>
    <Card style={{gap:13}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View><Text style={{fontWeight:'700',color:palette.ink}}>Monthly rhythm</Text><Text style={{fontSize:12,color:palette.muted,marginTop:4}}>Average weekly consistency this month</Text></View><Text style={{color:palette.purple,fontWeight:'800'}}>{month}% avg.</Text></View><View style={{height:115,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-around'}}>{monthValues.map((value,i)=><View key={i} style={{flex:1,alignItems:'center',gap:6}}><Text style={{fontSize:10,color:palette.muted}}>{value}%</Text><View style={{width:24,height:Math.max(5,value*.72),backgroundColor:i===monthValues.length-1?palette.purple:palette.purpleSoft,borderRadius:8}}/><Text style={{fontSize:10,color:palette.muted}}>W{i+1}</Text></View>)}</View></Card>
    <Card style={{gap:7,backgroundColor:palette.surfaceSoft}}><Text style={{fontSize:13,fontWeight:'700',color:palette.ink}}>How to read these</Text><Text style={{fontSize:12,lineHeight:18,color:palette.muted}}>Consistency is the share of habits you completed on days they were scheduled. Monthly rhythm averages each elapsed week in this calendar month. Streaks count consecutive scheduled days completed, so rest days do not break a streak.</Text></Card>
    <Text style={{fontSize:12,textAlign:'center',color:palette.muted}}>Your data stays private on this device.</Text>
  </Screen>;
}
