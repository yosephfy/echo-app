import React from "react";
import {
  DefaultSectionT,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { SettingsRow, SettingsRowProps } from "./SettingRow";

type Props = { sections: SectionListData<SettingsRowProps<any>>[] };

const SectionedSettingsList = ({ sections }: Props) => {
  const { colors } = useTheme();

  const renderHeader = ({
    key,
  }: SectionListData<SettingsRowProps<any>, DefaultSectionT>) => {
    return (
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerText, { color: colors.muted }]}>{key}</Text>
      </View>
    );
  };

  return (
    <SectionList
      sections={sections}
      renderSectionHeader={({ section }) => renderHeader(section)}
      renderItem={(item) => <SettingsRow {...item.item} />}
      SectionSeparatorComponent={() => (
        <View style={[styles.sep, { backgroundColor: colors.border }]} />
      )}
      contentContainerStyle={{ paddingVertical: 8 }}
      style={{ backgroundColor: colors.background }}
    />
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 16, paddingVertical: 10 },
  headerText: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
});

export default SectionedSettingsList;
