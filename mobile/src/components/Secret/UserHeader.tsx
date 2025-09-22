import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import Avatar from "../Avatar";
import { IconName } from "../../icons/icons";
import ActionButton from "./ActionButton";
import { useTheme } from "../../theme/ThemeContext";

interface UserHeaderProps {
  handle: string;
  timeAgo: string;
  avatarUri?: string;
  leftActions: {
    shown: ("more" | "cap" | "delete" | "edit")[];
    list: {
      name: "more" | "cap" | "delete" | "edit";
      icon: IconName;
      label?: string | number;
      onPress: () => any;
      selected?: boolean;
    }[];
  };
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  handle,
  timeAgo,
  avatarUri,
  leftActions,
}) => {
  let actions = leftActions.list.filter((item) =>
    leftActions.shown.includes(item.name)
  );
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Avatar url={avatarUri} handle={handle} size={40} />
        <View style={styles.textContainer}>
          <Text style={[styles.handle, { color: theme.colors.text }]}>
            {handle}
          </Text>
          <Text style={[styles.timeAgo, { color: theme.colors.text }]}>
            {timeAgo}
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        {actions.map((btn) => {
          return (
            <ActionButton
              icon={btn.icon}
              active={btn.selected}
              size={26}
              onPress={btn.onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 24,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textContainer: {
    flexDirection: "column",
    marginTop: 8,
  },
  handle: {
    fontSize: 17,
    fontWeight: "500",
    fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
  },
  timeAgo: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 7,
    fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
});
