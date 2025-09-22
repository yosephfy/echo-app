import { View, Text } from "react-native";
import React from "react";
import { SecretItemProps } from "./SecretItem";
import { useTheme } from "../../theme/ThemeContext";
import { useGlobalModal } from "../modal/GlobalModalProvider";
import Chip from "../Chip";
import { MOOD_COLOR_MAP } from "../../constants/moods";

type FooterProps = {
  moods: SecretItemProps["moods"];
  handle: string;
  isExpanded: boolean;
};

export const SecretFooter: React.FC<FooterProps> = ({
  moods,
  isExpanded,
  handle,
}) => {
  const { colors } = useTheme();
  const activeMoods = moods && moods.length ? moods.map((m) => m.code) : [];
  const maxCollapsedChips = 3;
  const visibleMoodCodes = isExpanded
    ? activeMoods
    : activeMoods.slice(0, maxCollapsedChips);
  const extraMoodCount = isExpanded
    ? 0
    : Math.max(0, activeMoods.length - maxCollapsedChips);
  const { show: showGlobalModal } = useGlobalModal();

  const openMoodsModal = () => {
    if (!moods || moods.length === 0) return;
    showGlobalModal({
      title: `${handle ?? "user"} was feeling`,
      message: (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {moods.map((m) => {
            const color = MOOD_COLOR_MAP[m.code] || colors.primary;
            return (
              <View
                key={m.code}
                style={{
                  backgroundColor: `${color}22`,
                  borderColor: color,
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {m.label ?? m.code}
                </Text>
              </View>
            );
          })}
        </View>
      ),
      cancelText: "Close",
    });
  };

  return (
    activeMoods.length > 0 && (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          flexWrap: isExpanded ? "wrap" : "nowrap",
          marginTop: 23,
          gap: isExpanded ? 6 : 0,
        }}
      >
        {visibleMoodCodes.map((code, idx) => {
          const color = MOOD_COLOR_MAP[code] || colors.primary;
          return (
            <View
              key={code + idx}
              style={{ marginLeft: idx === 0 ? 0 : isExpanded ? 0 : -30 }}
            >
              <Chip
                label={code}
                size="xs"
                variant="filled"
                color={color}
                bgColor={color}
                textColor={colors.text}
                borderColor={colors.background}
                borderWidth={0}
                radius={8}
                widthMode={isExpanded ? "auto" : "fixed"}
                width={60}
                onPress={openMoodsModal}
                style={{ height: 21, maxHeight: 21 }}
              />
            </View>
          );
        })}
        {extraMoodCount > 0 && (
          <View
            style={{
              marginLeft:
                visibleMoodCodes.length === 0 ? 0 : isExpanded ? 0 : -30,
            }}
          >
            <Chip
              label={`${extraMoodCount} more`}
              size="xs"
              variant="outline"
              color={colors.outline}
              bgColor={colors.outline}
              textColor={colors.text}
              borderWidth={0}
              borderColor={colors.background}
              radius={8}
              widthMode={isExpanded ? "auto" : "fixed"}
              width={60}
              onPress={openMoodsModal}
              style={{ height: 21, maxHeight: 21 }}
            />
          </View>
        )}
      </View>
    )
  );
};

export default SecretFooter;
