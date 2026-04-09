import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Keyboard,
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

interface ReminderTimePickerModalProps {
  visible: boolean;
  value: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}

const CLOCK_SIZE = 240;
const CLOCK_RADIUS = CLOCK_SIZE / 2;
const NUM_RADIUS = CLOCK_RADIUS - 32;

type Mode = "hour" | "minute";
type InputMode = "clock" | "keyboard";

const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function ReminderTimePickerModal({
  visible,
  value,
  onCancel,
  onConfirm,
}: ReminderTimePickerModalProps) {
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);

  const [hour12, setHour12] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [isPm, setIsPm] = useState(false);
  const [mode, setMode] = useState<Mode>("hour");
  const [inputMode, setInputMode] = useState<InputMode>("clock");

  // Keyboard input states
  const [hourInput, setHourInput] = useState("");
  const [minuteInput, setMinuteInput] = useState("");
  const [isHourFocused, setIsHourFocused] = useState(false);
  const [isMinuteFocused, setIsMinuteFocused] = useState(false);
  const hourInputRef = useRef<TextInput>(null);
  const minuteInputRef = useRef<TextInput>(null);

  // Use refs to track latest values for PanResponder
  const modeRef = useRef<Mode>(mode);
  const hour12Ref = useRef(hour12);
  const minutesRef = useRef(minutes);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    hour12Ref.current = hour12;
  }, [hour12]);

  useEffect(() => {
    minutesRef.current = minutes;
  }, [minutes]);

  useEffect(() => {
    if (!visible) return;
    const h = value.getHours();
    setIsPm(h >= 12);
    const h12 = h % 12 || 12;
    setHour12(h12);
    setMinutes(value.getMinutes());
    setMode("hour");
    setInputMode("clock");
    setHourInput(h12.toString());
    setMinuteInput(value.getMinutes().toString().padStart(2, "0"));
    setIsHourFocused(false);
    setIsMinuteFocused(false);
  }, [visible, value]);

  const preview = useMemo(() => {
    const date = new Date(value);
    const hours24 = isPm ? (hour12 % 12) + 12 : hour12 % 12;
    date.setHours(hours24);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }, [value, hour12, minutes, isPm]);

  const getAngleDeg = useCallback(() => {
    if (mode === "hour") {
      const idx = hourNumbers.indexOf(hour12);
      return (idx / 12) * 360;
    } else {
      return (minutes / 60) * 360;
    }
  }, [mode, hour12, minutes]);

  const angleDeg = getAngleDeg();
  const angleRad = (angleDeg - 90) * (Math.PI / 180);

  const handRadius = NUM_RADIUS;
  const handX = CLOCK_RADIUS + handRadius * Math.cos(angleRad);
  const handY = CLOCK_RADIUS + handRadius * Math.sin(angleRad);

  const handleClockTouch = useCallback((x: number, y: number) => {
    const dx = x - CLOCK_RADIUS;
    const dy = y - CLOCK_RADIUS;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    const currentMode = modeRef.current;

    if (currentMode === "hour") {
      const idx = Math.round(angle / 30) % 12;
      const newHour = hourNumbers[idx];
      setHour12(newHour);
      setHourInput(newHour.toString());
    } else {
      const minuteValue = Math.round(angle / 6) % 60;
      setMinutes(minuteValue);
      setMinuteInput(minuteValue.toString().padStart(2, "0"));
    }
  }, []);

  const clockRef = useRef<View>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          clockRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
            const x = e.nativeEvent.pageX - px;
            const y = e.nativeEvent.pageY - py;
            handleClockTouch(x, y);
          });
        },
        onPanResponderMove: (e) => {
          clockRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
            const x = e.nativeEvent.pageX - px;
            const y = e.nativeEvent.pageY - py;
            handleClockTouch(x, y);
          });
        },
        onPanResponderRelease: () => {
          if (modeRef.current === "hour") {
            setMode("minute");
          }
        },
      }),
    [handleClockTouch]
  );

  // Only sync inputs from clock values when NOT focused (not typing)
  useEffect(() => {
    if (!isHourFocused) {
      setHourInput(hour12.toString());
    }
  }, [hour12, isHourFocused]);

  useEffect(() => {
    if (!isMinuteFocused) {
      setMinuteInput(minutes.toString().padStart(2, "0"));
    }
  }, [minutes, isMinuteFocused]);

  const handleHourInputChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 2);
    setHourInput(cleaned);

    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      setHour12(num);
    }
  };

  const handleHourInputBlur = () => {
    setIsHourFocused(false);
    const num = parseInt(hourInput, 10);
    if (isNaN(num) || num < 1 || num > 12) {
      setHourInput(hour12.toString());
    } else {
      setHour12(num);
      setHourInput(num.toString());
    }
  };

  const handleMinuteInputChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 2);
    setMinuteInput(cleaned);

    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      setMinutes(num);
    }
  };

  const handleMinuteInputBlur = () => {
    setIsMinuteFocused(false);
    const num = parseInt(minuteInput, 10);
    if (isNaN(num) || num < 0 || num > 59) {
      setMinuteInput(minutes.toString().padStart(2, "0"));
    } else {
      setMinutes(num);
      setMinuteInput(num.toString().padStart(2, "0"));
    }
  };

  const toggleInputMode = () => {
    if (inputMode === "clock") {
      setInputMode("keyboard");
    } else {
      Keyboard.dismiss();
      setInputMode("clock");
    }
  };

  const hourDisplay = hour12.toString();
  const minuteDisplay = minutes.toString().padStart(2, "0");

  const isMinuteNumberSelected = (num: number) => {
    if (mode !== "minute") return false;
    return minutes === num;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          onCancel();
        }}
      >
        <View className="flex-1 bg-black/65 items-center justify-center px-5">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              className="w-full rounded-3xl border p-5"
              style={{
                backgroundColor: appTheme.card,
                borderColor: appTheme.cardBorder,
              }}
            >
              {/* Title */}
              <Text
                className="text-lg font-semibold mb-4"
                style={{ color: appTheme.textPrimary }}
              >
                Select time
              </Text>

              {/* Time Display Row */}
              <View className="flex-row items-center mb-5 gap-2">
                {inputMode === "clock" ? (
                  <>
                    {/* Hour Box */}
                    <TouchableOpacity
                      onPress={() => setMode("hour")}
                      className="rounded-xl items-center justify-center"
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        backgroundColor:
                          mode === "hour" ? appTheme.primary : appTheme.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 52,
                          fontWeight: "700",
                          color: mode === "hour" ? "#000" : "#fff",
                        }}
                      >
                        {hourDisplay}
                      </Text>
                    </TouchableOpacity>

                    {/* Colon */}
                    <Text
                      style={{ color: "#fff", fontSize: 48, fontWeight: "300" }}
                    >
                      :
                    </Text>

                    {/* Minute Box */}
                    <TouchableOpacity
                      onPress={() => setMode("minute")}
                      className="rounded-xl items-center justify-center"
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        backgroundColor:
                          mode === "minute"
                            ? appTheme.primary
                            : appTheme.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 52,
                          fontWeight: "700",
                          color: mode === "minute" ? "#000" : "#fff",
                        }}
                      >
                        {minuteDisplay}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Hour Input */}
                    <View
                      className="rounded-xl items-center justify-center"
                      style={{
                        flex: 1,
                        paddingVertical: 4,
                        backgroundColor:
                          mode === "hour" ? appTheme.primary : appTheme.surface,
                        borderWidth: mode === "hour" ? 2 : 1,
                        borderColor:
                          mode === "hour"
                            ? appTheme.primary
                            : appTheme.cardBorder,
                      }}
                    >
                      <TextInput
                        ref={hourInputRef}
                        value={hourInput}
                        onChangeText={handleHourInputChange}
                        onFocus={() => {
                          setIsHourFocused(true);
                          setMode("hour");
                          setHourInput("");
                        }}
                        onBlur={handleHourInputBlur}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={{
                          fontSize: 52,
                          fontWeight: "700",
                          color: mode === "hour" ? "#000" : "#fff",
                          textAlign: "center",
                          padding: 0,
                          minWidth: 60,
                        }}
                      />
                    </View>

                    {/* Colon */}
                    <Text
                      style={{ color: "#fff", fontSize: 48, fontWeight: "300" }}
                    >
                      :
                    </Text>

                    {/* Minute Input */}
                    <View
                      className="rounded-xl items-center justify-center"
                      style={{
                        flex: 1,
                        paddingVertical: 4,
                        backgroundColor:
                          mode === "minute"
                            ? appTheme.primary
                            : appTheme.surface,
                        borderWidth: mode === "minute" ? 2 : 1,
                        borderColor:
                          mode === "minute"
                            ? appTheme.primary
                            : appTheme.cardBorder,
                      }}
                    >
                      <TextInput
                        ref={minuteInputRef}
                        value={minuteInput}
                        onChangeText={handleMinuteInputChange}
                        onFocus={() => {
                          setIsMinuteFocused(true);
                          setMode("minute");
                          setMinuteInput("");
                        }}
                        onBlur={handleMinuteInputBlur}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={{
                          fontSize: 52,
                          fontWeight: "700",
                          color: mode === "minute" ? "#000" : "#fff",
                          textAlign: "center",
                          padding: 0,
                          minWidth: 60,
                        }}
                      />
                    </View>
                  </>
                )}

                {/* AM/PM */}
                <View
                  className="rounded-xl overflow-hidden border"
                  style={{ borderColor: appTheme.cardBorder, width: 64 }}
                >
                  <TouchableOpacity
                    onPress={() => setIsPm(false)}
                    className="items-center justify-center py-3"
                    style={{
                      backgroundColor: !isPm
                        ? appTheme.surface
                        : appTheme.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "600",
                        color: !isPm ? "#fff" : appTheme.textMuted,
                        fontSize: 14,
                      }}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsPm(true)}
                    className="items-center justify-center py-3 border-t"
                    style={{
                      borderTopColor: appTheme.cardBorder,
                      backgroundColor: isPm
                        ? appTheme.primary
                        : appTheme.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "600",
                        color: isPm ? "#000" : appTheme.textMuted,
                        fontSize: 14,
                      }}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Clock Face - only show in clock mode */}
              {inputMode === "clock" && (
                <View
                  ref={clockRef}
                  style={{
                    width: CLOCK_SIZE,
                    height: CLOCK_SIZE,
                    alignSelf: "center",
                    marginBottom: 20,
                    borderRadius: CLOCK_RADIUS,
                    backgroundColor: appTheme.surface,
                    position: "relative",
                  }}
                  {...panResponder.panHandlers}
                >
                  <Svg
                    width={CLOCK_SIZE}
                    height={CLOCK_SIZE}
                    style={{ position: "absolute" }}
                  >
                    <Line
                      x1={CLOCK_RADIUS}
                      y1={CLOCK_RADIUS}
                      x2={handX}
                      y2={handY}
                      stroke={appTheme.primary}
                      strokeWidth={2}
                    />
                    <Circle
                      cx={CLOCK_RADIUS}
                      cy={CLOCK_RADIUS}
                      r={5}
                      fill={appTheme.primary}
                    />
                  </Svg>

                  {(mode === "hour" ? hourNumbers : minuteNumbers).map(
                    (num, i) => {
                      const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
                      const x = CLOCK_RADIUS + NUM_RADIUS * Math.cos(angle);
                      const y = CLOCK_RADIUS + NUM_RADIUS * Math.sin(angle);

                      let isSelected: boolean;
                      if (mode === "hour") {
                        isSelected = num === hour12;
                      } else {
                        isSelected = isMinuteNumberSelected(num);
                      }

                      return (
                        <TouchableOpacity
                          key={`${mode}-${num}`}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (mode === "hour") {
                              setHour12(num);
                              setHourInput(num.toString());
                              setTimeout(() => setMode("minute"), 150);
                            } else {
                              setMinutes(num);
                              setMinuteInput(
                                num.toString().padStart(2, "0")
                              );
                            }
                          }}
                          style={{
                            position: "absolute",
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            alignItems: "center",
                            justifyContent: "center",
                            left: x - 20,
                            top: y - 20,
                            backgroundColor: isSelected
                              ? appTheme.primary
                              : "transparent",
                            zIndex: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? "#000" : "#ccc",
                              fontWeight: isSelected ? "700" : "500",
                              fontSize: 14,
                            }}
                          >
                            {mode === "minute"
                              ? num.toString().padStart(2, "0")
                              : num.toString()}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              )}

              {/* Footer */}
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="mr-auto p-2"
                  onPress={toggleInputMode}
                >
                  <Ionicons
                    name={
                      inputMode === "clock"
                        ? "keypad-outline"
                        : "time-outline"
                    }
                    size={22}
                    color={appTheme.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={onCancel} className="px-4 py-2">
                  <Text
                    style={{
                      color: appTheme.primary,
                      fontWeight: "600",
                      fontSize: 15,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    onConfirm(preview);
                  }}
                  className="px-4 py-2"
                >
                  <Text
                    style={{
                      color: appTheme.primary,
                      fontWeight: "600",
                      fontSize: 15,
                    }}
                  >
                    OK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}