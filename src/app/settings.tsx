import { useState } from 'react';
import { Modal, Pressable, Share, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Header, IconButton, Screen } from '../components/ui/Primitives';
import { useHabitly } from '../features/app/AppProvider';
import { exportLocalData } from '../database/repositories';
import { palette } from '../theme/tokens';

export default function Settings() {
  const { profileName, theme, accent, setPreference } = useHabitly();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profileName);
  const exportData = async () => {
    const data = await exportLocalData();
    await Share.share({ title: 'Habitly data export', message: JSON.stringify(data, null, 2) });
  };
  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await setPreference('profileName', trimmed);
    setEditingName(false);
  };

  return (
    <Screen>
      <Header title="Settings" subtitle="Make Habitly feel like yours." right={<IconButton label="‹" accessibilityLabel="Go back" onPress={() => router.back()} />} />
      <Card style={{ gap: 2 }}>
        <Text style={eyebrow}>PROFILE</Text>
        <SettingRow icon="👤" title="Name" value={profileName} onPress={() => { setName(profileName); setEditingName(true); }} />
      </Card>
      <Card style={{ gap: 3 }}>
        <Text style={eyebrow}>APPEARANCE</Text>
        <Text style={label}>Theme</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          {['system', 'light', 'dark'].map(option => <Button key={option} label={option[0].toUpperCase() + option.slice(1)} secondary={theme !== option} onPress={() => void setPreference('theme', option)} style={{ flex: 1, minHeight: 43, paddingHorizontal: 8 }} />)}
        </View>
        <Text style={[label, { marginTop: 12 }]}>Accent color</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 7 }}>
          {['#8068EA', '#568CEB', '#51A77A', '#F29B48', '#E27C9C'].map(color => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Set accent ${color}`} onPress={() => void setPreference('accent', color)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color, borderWidth: accent === color ? 3 : 0, borderColor: palette.ink }} />)}
        </View>
      </Card>
      <Card style={{ gap: 2 }}>
        <Text style={eyebrow}>DATA & PRIVACY</Text>
        <SettingRow icon="☁️" title="Data & Sync" value="On this device" onPress={() => void Share.share({ message: 'Your habits and tasks are saved locally and available offline. Cloud backup is not configured.' })} />
        <SettingRow icon="📦" title="Export data" onPress={() => void exportData()} />
        <SettingRow icon="🔔" title="Notifications" value="Task reminders" onPress={() => void Share.share({ message: 'Task reminders are scheduled locally on this device. Habit reminders are not available yet.' })} />
      </Card>
      <Card>
        <Text style={{ fontWeight: '800', color: palette.ink }}>Guest profile</Text>
        <Text style={{ fontSize: 13, color: palette.muted, lineHeight: 20, marginTop: 6 }}>Your habits and tasks are saved offline on this device. Account sign-in and cloud backup need service credentials.</Text>
      </Card>
      <Text style={{ textAlign: 'center', color: palette.muted, fontSize: 12 }}>Habitly · v1.0.0</Text>
      <Modal visible={editingName} animationType="slide" transparent onRequestClose={() => setEditingName(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: palette.overlay }}>
          <View style={{ backgroundColor: palette.canvas, padding: 23, borderTopLeftRadius: 27, borderTopRightRadius: 27, gap: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: palette.ink }}>Your name</Text>
            <TextInput autoFocus value={name} onChangeText={setName} maxLength={50} placeholder="Name" style={{ height: 52, backgroundColor: palette.input, borderRadius: 15, paddingHorizontal: 14, color: palette.ink }} />
            <View style={{ flexDirection: 'row', gap: 10 }}><Button label="Cancel" secondary onPress={() => setEditingName(false)} style={{ flex: 1 }} /><Button label="Save" onPress={() => void saveName()} style={{ flex: 1 }} /></View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function SettingRow({ icon, title, value, onPress }: { icon: string; title: string; value?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 }}><Text style={{ fontSize: 17 }}>{icon}</Text><Text style={{ flex: 1, color: palette.ink, fontSize: 14, fontWeight: '600' }}>{title}</Text>{value && <Text style={{ color: palette.muted, fontSize: 12 }}>{value}</Text>}<Text style={{ color: palette.muted, fontSize: 20 }}>›</Text></Pressable>;
}

const eyebrow = { fontSize: 12, color: palette.muted } as const;
const label = { fontSize: 14, color: palette.ink, marginTop: 8 } as const;
