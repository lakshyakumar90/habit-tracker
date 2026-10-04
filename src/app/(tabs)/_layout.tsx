import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useHabitly } from '../../features/app/AppProvider';
import { palette } from '../../theme/tokens';

const icons = {
  today: { active: 'view-dashboard', inactive: 'view-dashboard-outline' },
  habits: { active: 'sprout', inactive: 'sprout-outline' },
  tasks: { active: 'checkbox-marked-circle', inactive: 'checkbox-blank-circle-outline' },
  stats: { active: 'chart-box', inactive: 'chart-box-outline' },
} as const;

export default function TabLayout() {
  useHabitly(); // Theme changes update the native tab bar immediately.
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: palette.purple,
      tabBarInactiveTintColor: palette.tabInactive,
      tabBarStyle: { paddingTop: 6, borderTopColor: palette.line, backgroundColor: palette.card },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
      tabBarIconStyle: { marginTop: 1 },
    }}>
      {Object.entries(icons).map(([name, pair]) => (
        <Tabs.Screen key={name} name={name} options={{
          title: name[0].toUpperCase() + name.slice(1),
          tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? pair.active : pair.inactive} size={22} color={color} />,
        }} />
      ))}
    </Tabs>
  );
}
