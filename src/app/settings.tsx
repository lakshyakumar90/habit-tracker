import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Card, Header, IconButton, Screen } from '../components/ui/Primitives';
import { useHabitly } from '../features/app/AppProvider';
import { exportLocalData } from '../database/repositories';
import { getReminderPermissionStatus, requestReminderPermission, sendTestReminder } from '../services/notifications';
import { palette } from '../theme/tokens';

type Panel='sync'|'export'|'notifications'|null;
export default function Settings() {
  const { profileName, theme, accent, habits, tasks, setPreference } = useHabitly();
  const [editingName, setEditingName] = useState(false);const [name,setName]=useState(profileName);const [panel,setPanel]=useState<Panel>(null);const [message,setMessage]=useState('');
  const [permissionGranted,setPermissionGranted]=useState<boolean|null>(null);const [canAskAgain,setCanAskAgain]=useState(true);const [testingNotification,setTestingNotification]=useState(false);
  const saveName=async()=>{if(name.trim()){await setPreference('profileName',name.trim());setEditingName(false)}};
  const exportJson=async()=>JSON.stringify(await exportLocalData(),null,2);
  const copyData=async()=>{try{const Clipboard=await import('expo-clipboard');await Clipboard.setStringAsync(await exportJson());setMessage('JSON copied to your clipboard.')}catch{setMessage('This installed app is missing the clipboard native module. Install the latest Habitly development build, then try again.')}};
  const shareData=async()=>{try{const FileSystem=await import('expo-file-system/legacy');const Sharing=await import('expo-sharing');const json=await exportJson();const uri=`${FileSystem.cacheDirectory}habitly-export-${new Date().toISOString().slice(0,10)}.json`;await FileSystem.writeAsStringAsync(uri,json,{encoding:FileSystem.EncodingType.UTF8});if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:'application/json',dialogTitle:'Export Habitly data'});else setMessage('The JSON export was saved in the app cache, but sharing is unavailable on this device.')}catch{setMessage('This installed app is missing a data-export native module. Install the latest Habitly development build, then try again.')}};
  const enabledCount=habits.filter(h=>(h.notificationIds?.length??0)>0&&!h.archived).length+tasks.filter(t=>!!t.notificationId&&!t.completed).length;
  const panelTitle=panel==='sync'?'Data & Sync':panel==='export'?'Export data':'Notifications';
  const panelCopy=panel==='sync'?'Your habits, check-ins, tasks, and preferences are stored on this device. Cloud sync is not configured yet.':panel==='notifications'?`${enabledCount} reminders are scheduled on this device. A test notification can confirm delivery.`:'Create a portable JSON copy of your habits, history, tasks, and preferences.';
  const openNotifications=async()=>{setMessage('');setPanel('notifications');try{const status=await getReminderPermissionStatus();setPermissionGranted(status.granted);setCanAskAgain(status.canAskAgain)}catch(error){setMessage(error instanceof Error?error.message:'Could not read notification permission status.')}};
  const enableNotifications=async()=>{setMessage('');try{const granted=await requestReminderPermission();setPermissionGranted(granted);const status=await getReminderPermissionStatus();setCanAskAgain(status.canAskAgain);setMessage(granted?'Notifications are enabled.':'Permission was not granted. Use device settings to allow notifications.')}catch(error){setMessage(error instanceof Error?error.message:'Could not enable notifications.')}};
  const testNotification=async()=>{setMessage('');setTestingNotification(true);try{await sendTestReminder();setPermissionGranted(true);setMessage('Test scheduled for 5 seconds from now. Keep Habitly in the background to check the notification.')}catch(error){setMessage(error instanceof Error?error.message:'Could not schedule a test notification.')}finally{setTestingNotification(false)}};
  return <Screen>
    <Header title="Settings" subtitle="Make Habitly feel like yours." right={<IconButton icon="arrow-left" accessibilityLabel="Go back" onPress={()=>router.back()}/>} />
    <Card style={{gap:2}}><Text style={eyebrow()}>PROFILE</Text><SettingRow icon="account-outline" title="Name" value={profileName} onPress={()=>{setName(profileName);setEditingName(true)}}/></Card>
    <Card style={{gap:3}}><Text style={eyebrow()}>APPEARANCE</Text><Text style={label()}>Theme</Text><View style={{flexDirection:'row',gap:8,marginTop:6}}>{['system','light','dark'].map(option=><Button key={option} label={option[0].toUpperCase()+option.slice(1)} secondary={theme!==option} onPress={()=>void setPreference('theme',option)} style={{flex:1,minHeight:43,paddingHorizontal:8}}/>)}</View><Text style={[label(),{marginTop:12}]}>Accent color</Text><View style={{flexDirection:'row',gap:12,marginTop:8}}>{['#8068EA','#568CEB','#51A77A','#F29B48','#E27C9C'].map(color=><Pressable key={color} accessibilityRole="button" accessibilityState={{selected:accent===color}} accessibilityLabel={`Set accent ${color}`} onPress={()=>void setPreference('accent',color)} style={{width:34,height:34,borderRadius:17,backgroundColor:color,borderWidth:accent===color?3:1,borderColor:accent===color?palette.ink:palette.line,alignItems:'center',justifyContent:'center'}}>{accent===color&&<MaterialCommunityIcons name="check" size={17} color="white"/>}</Pressable>)}</View></Card>
    <Card style={{gap:2}}><Text style={eyebrow()}>DATA & PRIVACY</Text><SettingRow icon="database-outline" title="Data & Sync" value="On this device" onPress={()=>{setMessage('');setPanel('sync')}}/><SettingRow icon="export-variant" title="Export data" onPress={()=>{setMessage('');setPanel('export')}}/><SettingRow icon="bell-outline" title="Notifications" value={`${enabledCount} scheduled`} onPress={()=>void openNotifications()}/></Card>
    <Card><Text style={{fontWeight:'800',color:palette.ink}}>Guest profile</Text><Text style={{fontSize:13,color:palette.muted,lineHeight:20,marginTop:6}}>Your habits and tasks are saved offline on this device. Account sign-in and cloud backup need service credentials.</Text></Card>
    <Text style={{textAlign:'center',color:palette.muted,fontSize:12}}>Habitly · v1.0.0</Text>
    <Modal visible={editingName} animationType="slide" transparent statusBarTranslucent onRequestClose={()=>setEditingName(false)}><KeyboardAvoidingView style={scrim()} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS==='ios'?12:0}><View style={[sheet(),{maxHeight:'88%'}]}><Text style={{fontSize:22,fontWeight:'800',color:palette.ink}}>Your name</Text><TextInput autoFocus value={name} onChangeText={setName} maxLength={50} returnKeyType="done" onSubmitEditing={()=>void saveName()} placeholder="Name" placeholderTextColor={palette.muted} style={input()}/><View style={{flexDirection:'row',gap:10}}><Button label="Cancel" secondary onPress={()=>setEditingName(false)} style={{flex:1}}/><Button label="Save" onPress={()=>void saveName()} style={{flex:1}}/></View></View></KeyboardAvoidingView></Modal>
    <Modal visible={!!panel} animationType="slide" transparent statusBarTranslucent onRequestClose={()=>setPanel(null)}>
      <View style={scrim()}>
        <View style={sheet()}>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
            <Text style={{fontSize:21,fontWeight:'800',color:palette.ink}}>{panelTitle}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={()=>setPanel(null)} style={{padding:8}}><MaterialCommunityIcons name="close" size={23} color={palette.muted}/></Pressable>
          </View>
          <Text style={{fontSize:14,lineHeight:21,color:palette.muted}}>{panelCopy}</Text>
          {panel==='export'&&<><Button label="Share JSON file" onPress={()=>void shareData()}/><Button label="Copy JSON" secondary onPress={()=>void copyData()}/></>}
          {panel==='notifications'&&<>
            <View style={{flexDirection:'row',alignItems:'center',gap:9,padding:12,borderRadius:14,backgroundColor:palette.surfaceSoft}}><MaterialCommunityIcons name={permissionGranted?'check-circle':'bell-alert-outline'} size={20} color={permissionGranted?palette.success:palette.purple}/><Text style={{flex:1,fontSize:13,fontWeight:'600',color:palette.ink}}>{permissionGranted===null?'Checking notification permission…':permissionGranted?'Notifications are allowed on this device.':'Notifications are currently blocked.'}</Text></View>
            {!permissionGranted&&<Button label="Enable notifications" onPress={()=>void enableNotifications()}/>}
            {permissionGranted&&<Button label={testingNotification?'Scheduling…':'Send test notification (5 sec)'} onPress={()=>void testNotification()}/>}
            {permissionGranted===false&&!canAskAgain&&<Button label="Open device settings" secondary onPress={()=>void Linking.openSettings()}/>}
          </>}
          {!!message&&<Text accessibilityRole="alert" style={{fontSize:13,color:palette.purple}}>{message}</Text>}
          <Button label="Done" secondary onPress={()=>setPanel(null)}/>
        </View>
      </View>
    </Modal>
  </Screen>;
}
function SettingRow({icon,title,value,onPress}:{icon:string;title:string;value?:string;onPress:()=>void}){useHabitly();return <Pressable accessibilityRole="button" onPress={onPress} style={{minHeight:52,flexDirection:'row',alignItems:'center',paddingVertical:11,gap:11}}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={palette.purple}/><Text style={{flex:1,color:palette.ink,fontSize:14,fontWeight:'600'}}>{title}</Text>{value&&<Text style={{color:palette.muted,fontSize:12}}>{value}</Text>}<MaterialCommunityIcons name="chevron-right" size={20} color={palette.muted}/></Pressable>}
const eyebrow=()=>({fontSize:12,color:palette.muted});const label=()=>({fontSize:14,color:palette.ink,marginTop:8});const input=()=>({height:52,backgroundColor:palette.input,borderRadius:15,paddingHorizontal:14,color:palette.ink});const scrim=()=>({flex:1,justifyContent:'flex-end' as const,backgroundColor:palette.overlay});const sheet=()=>({backgroundColor:palette.canvas,padding:23,paddingBottom:34,borderTopLeftRadius:27,borderTopRightRadius:27,gap:14});
