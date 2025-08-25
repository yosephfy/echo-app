import React, { useState } from "react";
import {
  View,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { ReactionType } from "../hooks/useReactions";
import { IconSvg } from "../icons/IconSvg";
import ActionButton from "./ActionButton";
import { IconName } from "../icons/icons";

export const ICON_MAP: Record<ReactionType, IconName> = {
  like: "thumbs-up",
  love: "heart-full",
  haha: "face-with-tears-of-joy",
  wow: "face-screaming-in-fear",
  sad: "sad-but-relieved-face",
};

interface ReactionProps {
  current: ReactionType | null;
  onReact: (type: ReactionType) => void;
  totalCount: number;
  disabled?: boolean;
  loading?: boolean;
}

export default function Reaction({
  current,
  onReact,
  totalCount,
  disabled = false,
  loading = false,
}: ReactionProps) {
  const { colors } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);

  const handlePress = () => {
    if (disabled || loading) return;
    // Simple toggle UX: if have reaction, tapping repeats it -> server treats as toggle
    onReact(current ?? ReactionType.Love);
  };

  const handleLongPress = () => {
    if (disabled || loading) return;
    setPickerVisible(true);
  };

  const select = (type: ReactionType) => {
    if (disabled || loading) return;
    onReact(type);
    setPickerVisible(false);
  };

  return (
    <>
      <ActionButton
        icon={current ? ICON_MAP[current] : "heart"}
        onPress={handlePress}
        onLongPress={handleLongPress}
        label={totalCount > 0 ? totalCount : undefined}
        size={current ? 28 : undefined}
        style={styles.pressable}
        disabled={disabled}
        loading={loading}
        active={!!current}
      />

      {pickerVisible && (
        <>
          {/* invisible full-screen overlay to catch taps */}
          <Pressable
            style={styles.fullscreenOverlay}
            onPress={() => setPickerVisible(false)}
          />
          <View
            style={[
              styles.pickerOverlay,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: "black",
              },
            ]}
          >
            {Object.entries(ICON_MAP).map(([type, iconName]) => {
              const t = type as ReactionType;
              const isActive = current === t;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => select(t)}
                  style={[
                    styles.pickerButton,
                    isActive && { backgroundColor: colors.primary + "22" },
                  ]}
                >
                  <IconSvg
                    icon={iconName}
                    size={28}
                    state={isActive ? "pressed" : "default"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexDirection: "row",
    alignItems: "center",
  },
  fullscreenOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    zIndex: 10,
  },
  pickerOverlay: {
    position: "absolute",
    bottom: 36,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
    padding: 8,
    borderRadius: 30,
    borderWidth: 1,
    zIndex: 11,
    elevation: 6,
  },
  pickerButton: {
    padding: 8,
    borderRadius: 8,
  },
});
