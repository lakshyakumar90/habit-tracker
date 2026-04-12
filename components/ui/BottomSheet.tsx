import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";

interface CustomBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  snapPoints?: string[];
  children: React.ReactNode;
  onClose?: () => void;
}

function CustomBottomSheet({
  bottomSheetRef,
  snapPoints = DEFAULT_SNAP_POINTS,
  children,
  onClose,
}: CustomBottomSheetProps) {
  const theme = useSettingsStore((s) => s.theme);
  const appTheme = useMemo(() => getAppTheme(theme), [theme]);

  const backgroundStyle = useMemo(
    () => ({ backgroundColor: appTheme.card }),
    [appTheme.card],
  );

  const handleIndicatorStyle = useMemo(
    () => ({ backgroundColor: appTheme.textMuted }),
    [appTheme.textMuted],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
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
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      // Performance: prevent unnecessary layout recalculations
      enableDynamicSizing={false}
      // Performance: reduce overdraw on Android
      android_keyboardInputMode="adjustResize"
      // Performance: animate on the native thread
      animateOnMount={false}
    >
      <BottomSheetView style={styles.contentContainer}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
}

const DEFAULT_SNAP_POINTS = ["50%", "90%"];

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
});

export default React.memo(CustomBottomSheet);