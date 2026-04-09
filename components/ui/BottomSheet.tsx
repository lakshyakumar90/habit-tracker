import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";

interface CustomBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  snapPoints?: string[];
  children: React.ReactNode;
  onClose?: () => void;
}

export default function CustomBottomSheet({
  bottomSheetRef,
  snapPoints = ["50%", "90%"],
  children,
  onClose,
}: CustomBottomSheetProps) {
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={onClose}
      backgroundStyle={{ backgroundColor: appTheme.card }}
      handleIndicatorStyle={{ backgroundColor: appTheme.textMuted }}
    >
      <BottomSheetView style={styles.contentContainer}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
});
