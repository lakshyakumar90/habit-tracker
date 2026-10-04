import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TimeDialog } from '../components/ui/DateTimeDialogs';
import { Screen } from '../components/ui/Primitives';
import { useHabitly } from '../features/app/AppProvider';
import { cancelAllReminders, cancelEntityReminders, cancelReminder, scheduleDailyNudge, scheduleHabitReminders } from '../services/notifications';
import { clearLocalData, exportLocalData, habitsRepository, preferencesRepository } from '../database/repositories';
import { palette } from '../theme/tokens';

type Panel = 'sync' | 'export' | 'notifications' | null;
type TimeTarget = 'summary' | 'quote' | null;
const accents = ['#8068EA', '#568CEB', '#51A77A', '#F29B48', '#E27C9C', '#E2B84C'];

export default function Settings() {
  const { profileName, theme, accent, habits, tasks, setPreference, reload } = useHabitly();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profileName);
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [testingNotification, setTestingNotification] = useState(false);
  const [habitReminders, setHabitReminders] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [motivationalQuotes, setMotivationalQuotes] = useState(false);
  const [summaryTime, setSummaryTime] = useState('20:30');
  const [quoteTime, setQuoteTime] = useState('08:00');
  const [timeTarget, setTimeTarget] = useState<TimeTarget>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    void Promise.all([
      preferencesRepository.get('habitRemindersEnabled', 'true'), preferencesRepository.get('dailySummaryEnabled', 'false'),
      preferencesRepository.get('motivationalQuotesEnabled', 'false'), preferencesRepository.get('dailySummaryTime', '20:30'),
      preferencesRepository.get('motivationalQuotesTime', '08:00'),
    ]).then(([habitsOn, summaryOn, quotesOn, summaryAt, quoteAt]) => {
      setHabitReminders(habitsOn !== 'false'); setDailySummary(summaryOn === 'true'); setMotivationalQuotes(quotesOn === 'true');
      setSummaryTime(summaryAt); setQuoteTime(quoteAt);
    });
  }, []);

  const saveName = async () => { if (name.trim()) { await setPreference('profileName', name.trim()); setEditingName(false); } };
  const exportJson = async () => JSON.stringify(await exportLocalData(), null, 2);
  const copyData = async () => { try { const Clipboard = await import('expo-clipboard'); await Clipboard.setStringAsync(await exportJson()); setMessage('JSON copied to your clipboard.'); } catch { setMessage('Clipboard is unavailable in this installed app. Use Share JSON file to export your data.'); } };
  const shareData = async () => { try { const FileSystem = await import('expo-file-system/legacy'); const Sharing = await import('expo-sharing'); const json = await exportJson(); const uri = `${FileSystem.cacheDirectory}habitly-export-${new Date().toISOString().slice(0, 10)}.json`; await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export Habitly data' }); else setMessage('The export file was saved, but sharing is unavailable on this device.'); } catch { setMessage('Could not create the JSON export. Try again on this device.'); } };
  const enabledCount = habits.filter(habit => (habit.notificationIds?.length ?? 0) > 0 && !habit.archived).length + tasks.filter(task => !!task.notificationId && !task.completed).length;
  const panelTitle = panel === 'sync' ? 'Backup & sync' : panel === 'export' ? 'Export data' : 'Notification settings';
  const panelCopy = panel === 'sync' ? 'Your habits, check-ins, tasks, and preferences are stored on this device. Cloud sync will be available after account services are connected.' : panel === 'notifications' ? `${enabledCount} reminders are scheduled on this device.` : 'Create a portable JSON copy of your habits, history, tasks, and preferences.';

  const toggleHabitReminders = async (enabled: boolean) => {
    setWorking(true); setMessage('');
    try {
      for (const habit of habits) {
        await cancelEntityReminders(habit.id);
        const ids = enabled && !habit.archived && habit.reminderAt ? await scheduleHabitReminders(habit.id, habit.name, habit.schedule, habit.reminderAt) : [];
        await habitsRepository.setNotificationIds(habit.id, ids);
      }
      await setPreference('habitRemindersEnabled', String(enabled)); setHabitReminders(enabled); await reload();
      setMessage(enabled ? 'Saved habit reminders are enabled.' : 'Habit reminders are paused.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update habit reminders.'); }
    finally { setWorking(false); }
  };

  const toggleDaily = async (kind: 'summary' | 'quote', enabled: boolean, time = kind === 'summary' ? summaryTime : quoteTime) => {
    const enabledKey = kind === 'summary' ? 'dailySummaryEnabled' : 'motivationalQuotesEnabled';
    const idKey = kind === 'summary' ? 'dailySummaryNotificationId' : 'motivationalQuoteNotificationId';
    const title = kind === 'summary' ? 'Your Habitly daily summary' : 'A small thought for today';
    const body = kind === 'summary' ? 'Take a moment to review today’s habit progress.' : 'Small steps, repeated often, add up.';
    setWorking(true); setMessage('');
    try {
      const previousId = await preferencesRepository.get(idKey, '');
      if (previousId) await cancelReminder(previousId);
      if (enabled) {
        const nextId = await scheduleDailyNudge(title, body, time);
        await setPreference(idKey, nextId);
      } else await setPreference(idKey, '');
      await setPreference(enabledKey, String(enabled));
      if (kind === 'summary') setDailySummary(enabled); else setMotivationalQuotes(enabled);
      setMessage(enabled ? `Reminder scheduled for ${formatTime(time)}.` : 'Reminder turned off.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update this reminder.'); }
    finally { setWorking(false); }
  };

  const changeTime = async (time: string) => {
    if (timeTarget === 'summary') { setSummaryTime(time); await setPreference('dailySummaryTime', time); if (dailySummary) await toggleDaily('summary', true, time); }
    if (timeTarget === 'quote') { setQuoteTime(time); await setPreference('motivationalQuotesTime', time); if (motivationalQuotes) await toggleDaily('quote', true, time); }
    setTimeTarget(null);
  };

  const openNotifications = async () => { setMessage(''); setPanel('notifications'); try { const Notifications = await import('expo-notifications'); const status = await Notifications.getPermissionsAsync(); setPermissionGranted(status.granted); setCanAskAgain(status.canAskAgain); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not read notification permission status.'); } };
  const enableNotifications = async () => { setMessage(''); try { const { requestReminderPermission } = await import('../services/notifications'); const granted = await requestReminderPermission(); setPermissionGranted(granted); const Notifications = await import('expo-notifications'); setCanAskAgain((await Notifications.getPermissionsAsync()).canAskAgain); setMessage(granted ? 'Notifications are enabled.' : 'Permission was not granted. Use device settings to allow notifications.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not enable notifications.'); } };
  const testNotification = async () => { setMessage(''); setTestingNotification(true); try { const { sendTestReminder } = await import('../services/notifications'); await sendTestReminder(); setPermissionGranted(true); setMessage('Test scheduled for 5 seconds from now. Keep Habitly in the background to check delivery.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not schedule a test notification.'); } finally { setTestingNotification(false); } };
  const clearData = async () => { setWorking(true); setMessage(''); try { await cancelAllReminders(); await clearLocalData(); await reload(); setHabitReminders(true); setDailySummary(false); setMotivationalQuotes(false); setConfirmClear(false); setPanel(null); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not clear local data.'); } finally { setWorking(false); } };

  return <View style={{ flex: 1, backgroundColor: palette.canvas }}><Screen style={{ paddingBottom: 24 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={iconButton}><MaterialCommunityIcons name="arrow-left" size={21} color={palette.ink} /></Pressable><View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontSize: 29, fontWeight: '800', letterSpacing: -.5 }}>Settings</Text><Text style={{ color: palette.muted, fontSize: 13, marginTop: 2 }}>Customize your experience.</Text></View></View>
    <Pressable accessibilityRole="button" onPress={() => { setName(profileName); setEditingName(true); }} style={{ minHeight: 66, borderRadius: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }}><RowIcon icon="account-outline" /><View style={{ flex: 1 }}><Text style={rowTitle()}>{profileName}</Text><Text style={rowSubtitle()}>Edit your profile name</Text></View><MaterialCommunityIcons name="pencil-outline" size={18} color={palette.muted} /></Pressable>

    <SectionTitle title="Notifications" />
    <View style={groupStyle()}>
      <ToggleRow icon="bell-outline" title="Habit reminders" subtitle="Pause or resume reminders you set on habits" value={habitReminders} disabled={working} onChange={value => void toggleHabitReminders(value)} />
      <TimeRow icon="clock-outline" title="Daily summary" subtitle="Review your progress each evening" value={dailySummary} time={summaryTime} onToggle={value => void toggleDaily('summary', value)} onTime={() => setTimeTarget('summary')} disabled={working} />
      <TimeRow icon="star-outline" title="Motivational quotes" subtitle="A gentle reminder to keep going" value={motivationalQuotes} time={quoteTime} onToggle={value => void toggleDaily('quote', value)} onTime={() => setTimeTarget('quote')} disabled={working} last />
    </View>

    <SectionTitle title="Appearance" />
    <View style={groupStyle()}><View style={{ paddingHorizontal: 14, paddingTop: 13 }}><Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600' }}>Theme</Text><View style={{ flexDirection: 'row', gap: 7, marginTop: 9 }}>{['light', 'dark', 'system'].map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ selected: theme === option }} onPress={() => void setPreference('theme', option)} style={{ flex: 1, minHeight: 37, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme === option ? palette.purple : palette.surfaceSoft }}><Text style={{ color: theme === option ? palette.onPrimary : palette.muted, fontSize: 11, fontWeight: '600' }}>{option[0].toUpperCase() + option.slice(1)}</Text></Pressable>)}</View></View>
      <View style={{ paddingHorizontal: 14, paddingVertical: 13 }}><Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600' }}>Accent color</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginTop: 11 }}>{accents.map(color => <Pressable key={color} accessibilityRole="radio" accessibilityState={{ selected: accent === color }} accessibilityLabel={`Set accent ${color}`} onPress={() => void setPreference('accent', color)} style={{ width: 35, height: 35, borderRadius: 18, backgroundColor: color, borderWidth: accent === color ? 3 : 1, borderColor: accent === color ? palette.ink : palette.line, alignItems: 'center', justifyContent: 'center' }}>{accent === color && <MaterialCommunityIcons name="check" size={17} color="white" />}</Pressable>)}</View></View>
    </View>

    <SectionTitle title="Data" />
    <View style={groupStyle()}>
      <SettingRow icon="cloud-outline" title="Backup & sync" subtitle="Stored locally on this device" onPress={() => { setMessage(''); setPanel('sync'); }} />
      <SettingRow icon="database-export-outline" title="Export data" subtitle="Download a JSON copy of your data" onPress={() => { setMessage(''); setPanel('export'); }} />
      <SettingRow icon="bell-badge-outline" title="Notification status" subtitle={`${enabledCount} reminders scheduled`} onPress={() => void openNotifications()} />
      <SettingRow icon="delete-outline" title="Clear all data" subtitle="Delete habits, check-ins, and tasks" destructive onPress={() => setConfirmClear(true)} last />
    </View>
    <Text style={{ textAlign: 'center', color: palette.muted, fontSize: 11 }}>Habitly · v1.0.0</Text>

    {!!message && !panel && <Text accessibilityRole="alert" style={{ color: palette.purple, fontSize: 12, textAlign: 'center' }}>{message}</Text>}
    <Modal visible={editingName} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setEditingName(false)}><KeyboardAvoidingView style={scrim()} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><Pressable accessibilityRole="button" accessibilityLabel="Close name editor" onPress={() => setEditingName(false)} style={StyleSheet.absoluteFill} /><View style={sheetStyle()}><Text style={{ fontSize: 21, fontWeight: '800', color: palette.ink }}>Your name</Text><TextInput autoFocus value={name} onChangeText={setName} maxLength={50} returnKeyType="done" onSubmitEditing={() => void saveName()} placeholder="Name" placeholderTextColor={palette.muted} style={inputStyle()} /><View style={{ flexDirection: 'row', gap: 10 }}><ActionButton label="Cancel" secondary onPress={() => setEditingName(false)} /><ActionButton label="Save" onPress={() => void saveName()} /></View></View></KeyboardAvoidingView></Modal>

    <Modal visible={!!panel} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setPanel(null)}><View style={scrim()}><Pressable accessibilityRole="button" accessibilityLabel="Close panel" onPress={() => setPanel(null)} style={StyleSheet.absoluteFill} /><View style={sheetStyle()}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ fontSize: 20, fontWeight: '800', color: palette.ink }}>{panelTitle}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setPanel(null)} style={iconButton}><MaterialCommunityIcons name="close" size={21} color={palette.ink} /></Pressable></View><Text style={{ fontSize: 13, lineHeight: 20, color: palette.muted }}>{panelCopy}</Text>
      {panel === 'export' && <><ActionButton label="Share JSON file" onPress={() => void shareData()} /><ActionButton label="Copy JSON" secondary onPress={() => void copyData()} /></>}
      {panel === 'notifications' && <><View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 14, backgroundColor: palette.surfaceSoft }}><MaterialCommunityIcons name={permissionGranted ? 'check-circle' : 'bell-alert-outline'} size={20} color={permissionGranted ? palette.success : palette.purple} /><Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: palette.ink }}>{permissionGranted === null ? 'Checking notification permission…' : permissionGranted ? 'Notifications are allowed on this device.' : 'Notifications are currently blocked.'}</Text></View>{!permissionGranted && <ActionButton label="Enable notifications" onPress={() => void enableNotifications()} />}{permissionGranted && <ActionButton label={testingNotification ? 'Scheduling…' : 'Send test notification'} onPress={() => void testNotification()} />}{permissionGranted === false && !canAskAgain && <ActionButton label="Open device settings" secondary onPress={() => void Linking.openSettings()} />}</>}
      {!!message && <Text accessibilityRole="alert" style={{ fontSize: 12, color: palette.purple }}>{message}</Text>}<ActionButton label="Done" secondary onPress={() => setPanel(null)} /></View></View></Modal>

    <Modal visible={confirmClear} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setConfirmClear(false)}><View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: palette.overlay }}><Pressable accessibilityRole="button" accessibilityLabel="Close confirmation" onPress={() => setConfirmClear(false)} style={StyleSheet.absoluteFill} /><View style={{ backgroundColor: palette.card, padding: 20, borderRadius: 24, gap: 12 }}><MaterialCommunityIcons name="alert-circle-outline" size={30} color={palette.danger} /><Text style={{ color: palette.ink, fontSize: 20, fontWeight: '800' }}>Clear all local data?</Text><Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>This permanently deletes your habits, history, and tasks from this device. Your appearance settings will return to their defaults.</Text><View style={{ flexDirection: 'row', gap: 10 }}><ActionButton label="Cancel" secondary onPress={() => setConfirmClear(false)} /><ActionButton label={working ? 'Clearing…' : 'Delete data'} destructive onPress={() => void clearData()} /></View></View></View></Modal>
    <TimeDialog visible={timeTarget !== null} value={timeTarget === 'quote' ? quoteTime : summaryTime} title={timeTarget === 'quote' ? 'Quote reminder time' : 'Daily summary time'} onClose={() => setTimeTarget(null)} onSelect={time => void changeTime(time)} />
  </Screen></View>;
}

function SectionTitle({ title }: { title: string }) { return <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700', marginBottom: -8 }}>{title}</Text>; }
function ToggleRow({ icon, title, subtitle, value, onChange, disabled = false }: { icon: string; title: string; subtitle: string; value: boolean; onChange: (next: boolean) => void; disabled?: boolean }) { return <View style={rowStyle()}><RowIcon icon={icon} /><View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={rowTitle()}>{title}</Text><Text numberOfLines={2} style={rowSubtitle()}>{subtitle}</Text></View><Switch value={value} disabled={disabled} onValueChange={onChange} trackColor={{ false: palette.line, true: palette.purple }} thumbColor={palette.card} /></View>; }
function TimeRow({ icon, title, subtitle, value, time, onToggle, onTime, disabled, last }: { icon: string; title: string; subtitle: string; value: boolean; time: string; onToggle: (next: boolean) => void; onTime: () => void; disabled: boolean; last?: boolean }) { return <View style={[rowStyle(), !last && { borderBottomWidth: 1, borderColor: palette.line }]}><RowIcon icon={icon} /><View style={{ flex: 1 }}><Text style={rowTitle()}>{title}</Text><Text style={rowSubtitle()}>{subtitle}</Text><Pressable accessibilityRole="button" onPress={onTime} style={{ alignSelf: 'flex-start', marginTop: 6 }}><Text style={{ color: palette.purple, fontSize: 11, fontWeight: '700' }}>At {formatTime(time)}</Text></Pressable></View><Switch value={value} disabled={disabled} onValueChange={onToggle} trackColor={{ false: palette.line, true: palette.purple }} thumbColor={palette.card} /></View>; }
function SettingRow({ icon, title, subtitle, destructive, onPress, last }: { icon: string; title: string; subtitle: string; destructive?: boolean; onPress: () => void; last?: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[rowStyle(), !last && { borderBottomWidth: 1, borderColor: palette.line }]}><RowIcon icon={icon} /><View style={{ flex: 1 }}><Text style={[rowTitle(), destructive && { color: palette.danger }]}>{title}</Text><Text style={rowSubtitle()}>{subtitle}</Text></View><MaterialCommunityIcons name="chevron-right" size={20} color={palette.muted} /></Pressable>; }
function RowIcon({ icon }: { icon: string }) { return <View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={19} color={palette.purple} /></View>; }
function ActionButton({ label, onPress, secondary, destructive }: { label: string; onPress: () => void; secondary?: boolean; destructive?: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={{ flex: 1, minHeight: 47, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: destructive ? palette.danger : secondary ? palette.purpleSoft : palette.purple }}><Text style={{ color: destructive || !secondary ? palette.onPrimary : palette.purple, fontSize: 13, fontWeight: '700' }}>{label}</Text></Pressable>; }
const rowStyle = () => ({ minHeight: 66, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, paddingHorizontal: 13, paddingVertical: 9 });
const groupStyle = () => ({ borderRadius: 22, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, paddingVertical: 2 });
const rowTitle = () => ({ color: palette.ink, fontSize: 13, fontWeight: '600' as const });
const rowSubtitle = () => ({ color: palette.muted, fontSize: 10, lineHeight: 14, marginTop: 2 });
const iconButton = { width: 42, height: 42, borderRadius: 21, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: palette.surfaceSoft };
const scrim = () => ({ flex: 1, justifyContent: 'flex-end' as const, backgroundColor: palette.overlay });
const sheetStyle = () => ({ backgroundColor: palette.canvas, padding: 22, paddingBottom: 30, borderTopLeftRadius: 26, borderTopRightRadius: 26, gap: 13 });
const inputStyle = () => ({ height: 52, backgroundColor: palette.input, borderRadius: 15, paddingHorizontal: 14, color: palette.ink });
function formatTime(value: string) { const [hourText, minute] = value.split(':'); const hour = Number(hourText); if (!Number.isFinite(hour) || !minute) return value; return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`; }
