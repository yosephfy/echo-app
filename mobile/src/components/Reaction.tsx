// mobile/src/components/Reaction.tsx
import React, { useState } from "react";
import {
  View,
  Pressable,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { ReactionType } from "../hooks/useReactions";
import { IconSvg } from "../icons/IconSvg";
import ActionButton from "./ActionButton";

export const ICON_MAP: Record<ReactionType, string> = {
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
}

export default function Reaction({
  current,
  onReact,
  totalCount,
}: ReactionProps) {
  const { colors } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);

  const handlePress = () => {
    // toggle like
    //onReact(current === ReactionType.Like ? null : ReactionType.Like);
    current ? onReact(current) : onReact(ReactionType.Love);
  };

  const handleLongPress = () => {
    setPickerVisible(true);
  };

  const select = (type: ReactionType) => {
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
        size={current ? 30 : undefined}
        style={styles.pressable}
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
              { backgroundColor: colors.card, borderColor: colors.border },
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
    //backgroundColor: "blue",
  },

  fullscreenOverlay: {
    position: "absolute",
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    zIndex: 1,
    //backgroundColor: "blue",
  },
  pickerOverlay: {
    position: "absolute",
    bottom: 36,
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
    maxWidth: Dimensions.get("window").width - 32,
    overflow: "scroll",
    padding: 8,
    borderRadius: 30,
    borderWidth: 1,
    zIndex: 2,
    opacity: 0.8,
  },
  pickerButton: {
    padding: 8,
    borderRadius: 6,
  },
});
