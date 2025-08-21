import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { SectionListData } from "react-native";
import SectionedSettingsList from "../../components/SectionedSettingsList";
import { SettingsRowProps } from "../../components/SettingRow";
import { useSetting } from "../../hooks/useSetting";
import { AccountSettingsStackParamList } from "../../navigation/AccountScreenNavigator";

type Props = NativeStackScreenProps<
  AccountSettingsStackParamList,
  "Notifications"
>;
const NotificationsScreen = ({ navigation }: Props) => {
  const [enabled_pushNotification, setEnabled_pushNotification] =
    useSetting<boolean>("notifications.push.enabled");
  const [enabled_pushPosts, setEnabled_pushPosts] = useSetting<boolean>(
    "notifications.push.posts"
  );
  const [enabled_pushComments, setEnabled_pushComments] = useSetting<boolean>(
    "notifications.push.comments"
  );

  const [enabled_dailyReminder, setEnabled_dailyReminder] = useSetting<boolean>(
    "notifications.dailyReminder"
  );
  const MENU_ITEMS: SectionListData<SettingsRowProps<any>>[] = [
    {
      key: "Push Notifications",
      data: [
        {
          type: "switch",
          label: "Enable Push Notifications",
          icon: "bell",
          options: {
            value: !!enabled_pushNotification,
            onValueChange: setEnabled_pushNotification,
          },
        } as SettingsRowProps<"switch">,
        {
          type: "switch",
          label: "Notifications About my Posts",
          icon: "cards",
          options: {
            value: !!enabled_pushPosts,
            onValueChange: setEnabled_pushPosts,
          },
        } as SettingsRowProps<"switch">,
        {
          type: "switch",
          label: "Notifications About my Comments",
          icon: "comment",
          options: {
            value: !!enabled_pushComments,
            onValueChange: setEnabled_pushComments,
          },
        } as SettingsRowProps<"switch">,
      ],
    },
    {
      key: "Other",
      data: [
        {
          type: "switch",
          label: "Daily Reminder",
          icon: "calendar-day",
          options: {
            value: !!enabled_dailyReminder,
            onValueChange: setEnabled_dailyReminder,
          },
        } as SettingsRowProps<"switch">,
      ],
    },
  ];

  return <SectionedSettingsList sections={MENU_ITEMS} />;
};

export default NotificationsScreen;
