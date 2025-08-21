import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { SectionListData } from "react-native";
import SectionedSettingsList from "../../components/SectionedSettingsList";
import { SettingsRowProps } from "../../components/SettingRow";
import { AccountSettingsStackParamList } from "../../navigation/AccountScreenNavigator";
import { useSetting } from "../../hooks/useSetting";

type Props = NativeStackScreenProps<AccountSettingsStackParamList, "Privacy">;
const PrivacyScreen = ({ navigation }: Props) => {
  const [enabled_showInDiscover, setEnabled_showInDiscover] =
    useSetting<boolean>("privacy.showInDiscover");
  const [enabled_showActivity, setEnabled_showActivity] = useSetting<boolean>(
    "privacy.showActivity"
  );
  const [value_whoCanReply, set_whoCanReply, meta_whoCanReply] =
    useSetting<string>("privacy.allowReplies");
  const [enabled_showReactionCount, setEnabled_showReactionCount] =
    useSetting<boolean>("privacy.showReactionCounts");
  const [enabled_blurSensitive, setEnabled_blurSensitive] = useSetting<boolean>(
    "privacy.blurSensitive"
  );
  const [value_mutedKeywords, set_mutedKeywords, meta_mutedKeywords] =
    useSetting<string>("privacy.mutedKeywords");
  const MENU_ITEMS: SectionListData<SettingsRowProps<any>>[] = [
    {
      key: "Visibility",
      data: [
        {
          type: "switch",
          label: "Show in Discover",
          //icon: "search-alt",
          options: {
            value: !!enabled_showInDiscover,
            onValueChange: setEnabled_showInDiscover,
          },
        } as SettingsRowProps<"switch">,
        {
          type: "switch",
          label: "Show activity on profile",
          //icon: "home",
          options: {
            value: !!enabled_showActivity,
            onValueChange: setEnabled_showActivity,
          },
        } as SettingsRowProps<"switch">,
      ],
    },
    {
      key: "Interactions",
      data: [
        {
          type: "dropdown",
          label: "Who can reply",
          //icon: "comment",
          options: {
            items: (meta_whoCanReply.options ?? []).map((o) => ({
              label: o.label,
              value: o.value,
            })),
            selected: value_whoCanReply ?? meta_whoCanReply.defaultValue ?? "",
            onSelect: (v: string) => set_whoCanReply(v),
          },
        } as SettingsRowProps<"dropdown">,

        {
          type: "switch",
          label: "Show reaction counts",
          //icon: "heart",
          options: {
            value: !!enabled_showReactionCount,
            onValueChange: setEnabled_showReactionCount,
          },
        } as SettingsRowProps<"switch">,
      ],
    },
    {
      key: "Saftey",
      data: [
        {
          type: "switch",
          label: "Blur sensitive content",
          icon: "eye-off",
          options: {
            value: !!enabled_blurSensitive,
            onValueChange: setEnabled_blurSensitive,
          },
        } as SettingsRowProps<"switch">,

        {
          type: "navigation",
          label: "Blocked users",
          icon: "blocked",
          options: {
            route: "About",
            navigation,
          },
        } as SettingsRowProps<"navigation">,

        {
          type: "navigation",
          label: "Muted keywords",
          icon: "mute",
          options: {
            route: "About",
            navigation,
          },
        } as SettingsRowProps<"navigation">,
      ],
    },
  ];

  return <SectionedSettingsList sections={MENU_ITEMS} />;
};

export default PrivacyScreen;
