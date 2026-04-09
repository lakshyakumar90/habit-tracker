import { useCelebrationStore } from "@/store/useCelebrationStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getAppTheme } from "@/constants/appThemes";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View } from "react-native";

const PARTICLE_COUNT = 24;

interface Particle {
  x: number;
  size: number;
  rotate: number;
  color: string;
  delay: number;
  duration: number;
}

export default function CelebrationOverlay() {
  const { visible, burstKey, hideBurst } = useCelebrationStore();
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);
  const progressValues = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0)),
  ).current;

  const particles = useMemo<Particle[]>(() => {
    const colors = [
      appTheme.primaryLight,
      "#60a5fa",
      "#f59e0b",
      "#f472b6",
      "#22d3ee",
    ];
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: (i - PARTICLE_COUNT / 2) * 10 + Math.random() * 20,
      size: 5 + Math.random() * 7,
      rotate: Math.random() * 220 - 110,
      color: colors[(i + burstKey) % colors.length],
      delay: Math.random() * 220,
      duration: 700 + Math.random() * 600,
    }));
  }, [burstKey, appTheme.primaryLight]);

  useEffect(() => {
    if (!visible) return;

    const animations = progressValues.map((value, i) => {
      value.setValue(0);
      return Animated.timing(value, {
        toValue: 1,
        duration: particles[i].duration,
        delay: particles[i].delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    });

    Animated.parallel(animations).start(() => hideBurst());
  }, [visible, burstKey, hideBurst, particles, progressValues]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 260,
        zIndex: 50,
      }}
    >
      {particles.map((particle, i) => {
        const translateY = progressValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 230],
        });
        const translateX = progressValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.x],
        });
        const rotate = progressValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${particle.rotate}deg`],
        });
        const opacity = progressValues[i].interpolate({
          inputRange: [0, 0.75, 1],
          outputRange: [1, 1, 0],
        });

        return (
          <Animated.View
            key={`${burstKey}-${i}`}
            style={{
              position: "absolute",
              left: "50%",
              top: 14,
              width: particle.size,
              height: particle.size,
              borderRadius: 2,
              backgroundColor: particle.color,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
