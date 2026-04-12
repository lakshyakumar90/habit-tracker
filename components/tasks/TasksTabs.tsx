import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated as RNAnimated,
} from "react-native";
import PagerView from "react-native-pager-view";
import AllTasksView from "./AllTasksView";
import TimelineView from "./TimelineView";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function TasksTabs() {
  const selectedTheme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(selectedTheme);

  const [activeTab, setActiveTab] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const indicatorPosition = useRef(new RNAnimated.Value(0)).current;

  const handleTabPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(index);
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    if (activeTab !== position) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(position);
    }
  };

  const handlePageScroll = (e: any) => {
    const { offset, position } = e.nativeEvent;
    // Map offset/position to indicator layout
    const absoluteOffset = position + offset;
    indicatorPosition.setValue(absoluteOffset);
  };

  return (
    <View className="flex-1">
      {/* Custom Native Tab Bar */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: `${appTheme.cardBorder}66`,
          backgroundColor: "transparent",
        }}
      >
        {["Timeline", "All Tasks"].map((title, index) => {
          const isActive = activeTab === index;
          return (
            <TouchableOpacity
              key={index}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 12,
              }}
              onPress={() => handleTabPress(index)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: isActive ? appTheme.primary : appTheme.textMuted,
                  fontSize: 15,
                  fontWeight: isActive ? "600" : "500",
                }}
              >
                {title}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* Animated Indicator */}
        <RNAnimated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: SCREEN_WIDTH / 2,
            height: 3,
            backgroundColor: appTheme.primary,
            borderRadius: 999,
            transform: [
              {
                translateX: indicatorPosition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_WIDTH / 2],
                }),
              },
            ],
          }}
        />
      </View>

      {/* Natively smoothly swipable PagerView */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
        overScrollMode="always"
        keyboardDismissMode="on-drag"
      >
        <View key="timeline" style={{ flex: 1 }}>
          <TimelineView />
        </View>
        <View key="all-tasks" style={{ flex: 1 }}>
          <AllTasksView />
        </View>
      </PagerView>
    </View>
  );
}

export default React.memo(TasksTabs);
