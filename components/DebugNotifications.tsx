import {
    debugListScheduled,
    scheduleHabitReminders,
    scheduleTestReminder,
} from "@/services/reminderNotifications";
import { Alert, Button, View } from "react-native";

export function DebugNotifications() {
  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Button
        title="Test: 10 second notification"
        onPress={async () => {
          const id = await scheduleTestReminder();
          Alert.alert("Scheduled", `ID: ${id}\nWait 10 seconds...`);
        }}
      />
      <Button
        title="Test: Schedule Weekly (Mon 9:00 AM)"
        onPress={async () => {
          const ids = await scheduleHabitReminders({
            habitId: "test-habit-123",
            habitName: "Drink Water",
            hour: 9,
            minute: 0,
            days: [2],
          });
          Alert.alert("Scheduled", `${ids.length} reminders set`);
        }}
      />
      <Button
        title="Test: Schedule in 1 min"
        onPress={async () => {
          const now = new Date();
          const fireTime = new Date(now.getTime() + 60 * 1000);

          const ids = await scheduleHabitReminders({
            habitId: "test-habit-456",
            habitName: "Test Habit",
            hour: fireTime.getHours(),
            minute: fireTime.getMinutes(),
            days: [fireTime.getDay() + 1],
          });

          Alert.alert(
            "Scheduled",
            `${ids.length} set for ${fireTime.getHours()}:${fireTime.getMinutes()}`,
          );
        }}
      />
      <Button
        title="Debug: List all scheduled"
        onPress={async () => {
          await debugListScheduled();
          Alert.alert("Check console logs");
        }}
      />
    </View>
  );
}
