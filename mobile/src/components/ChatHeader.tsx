import React from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle } from "react-native";
import Avatar from "./Avatar";
import { IconSvg } from "../icons/IconSvg";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useTheme } from "../theme/ThemeContext";

export type ChatHeaderProps = {
  handle?: string | null;
  avatarUrl?: string | null;
  subtitle?: string | null;
  onPressAvatar?: () => void;
  onPressOptions?: () => void;
  containerStyle?: ViewStyle;
  showBack?: boolean;
};

export default function ChatHeader({
  handle,
  avatarUrl,
  subtitle,
  onPressAvatar,
  onPressOptions,
  containerStyle,
  showBack = true,
}: ChatHeaderProps) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const h = handle || "user";

  return (
    <View
      style={[
        styles.root,
        {
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        },
        containerStyle,
      ]}
    >
      {showBack ? (
        <Pressable
          onPress={() => nav.goBack()}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <IconSvg icon="chevron-left" size={26} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}

      <View style={styles.center}>
        <Avatar
          handle={h}
          url={avatarUrl ?? undefined}
          size={40}
          onPress={onPressAvatar}
        />
        <View style={styles.textWrap}>
          <Text style={[styles.handle, { color: colors.text }]}>@{h}</Text>
          {!!subtitle && (
            <Text
              style={[styles.subtitle, { color: colors.muted }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={onPressOptions}
        hitSlop={10}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel="Conversation options"
      >
        <IconSvg icon="more-vertical" size={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 4, marginHorizontal: 2 },
  center: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  textWrap: { flex: 1 },
  handle: { fontSize: 16, fontWeight: "600" },
  subtitle: { fontSize: 12, marginTop: 2 },
});
