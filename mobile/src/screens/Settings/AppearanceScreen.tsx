import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { SectionListData } from "react-native";
import SectionedSettingsList from "../../components/SectionedSettingsList";
import { SettingsRowProps } from "../../components/SettingRow";
import { useSetting } from "../../hooks/useSetting";
import { AccountSettingsStackParamList } from "../../navigation/AccountScreenNavigator";

type Props = NativeStackScreenProps<AccountSettingsStackParamList, "Display">;
const DisplayScreen = ({ navigation }: Props) => {
  const [value_theme, set_Theme, meta_theme] =
    useSetting<string>("appearance.theme");
  const [value_fontSize, set_FontSize, meta_fontSize] = useSetting<string>(
    "appearance.fontSize"
  );

  const [enabled_reducedAnimation, setEnabled_reducedAnimation] =
    useSetting<boolean>("appearance.reduceMotion");

  const MENU_ITEMS: SectionListData<SettingsRowProps<any>>[] = [
    {
      key: "Appearance",
      data: [
        {
          type: "dropdown",
          icon: "color-palette",
          label: meta_theme.label ?? "Appearance",
          options: {
            items: (meta_theme.options ?? []).map((o) => ({
              label: o.label,
              value: o.value,
            })),
            selected: value_theme ?? meta_theme.defaultValue ?? "",
            onSelect: (v: string) => set_Theme(v),
          },
        } as SettingsRowProps<"dropdown">,

        {
          type: "dropdown",
          icon: "text-size",
          label: meta_fontSize.label ?? "Text Size",
          options: {
            items: (meta_fontSize.options ?? []).map((o) => ({
              label: o.label,
              value: o.value,
            })),
            selected: value_fontSize ?? meta_fontSize?.defaultValue ?? "",
            onSelect: (v: string) => set_FontSize(v),
          },
        } as SettingsRowProps<"dropdown">,
        {
          type: "switch",
          label: "Reduce Animation",
          icon: "animation",
          options: {
            value: !!enabled_reducedAnimation,
            onValueChange: setEnabled_reducedAnimation,
          },
        } as SettingsRowProps<"switch">,
      ],
    },
  ];

  return <SectionedSettingsList sections={MENU_ITEMS} />;
};

export default DisplayScreen;
