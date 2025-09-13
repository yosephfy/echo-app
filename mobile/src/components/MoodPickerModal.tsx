import React, { useMemo, useState } from "react";
import {
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  StyleSheet,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useComposer } from "../store/composer";
import { MOODS } from "../constants/moods";

export default function MoodPickerModal() {
  const { colors, spacing, radii, fontSizes } = useTheme();
  const composer = useComposer();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOODS;
    return MOODS.filter(
      (m) => m.code.includes(q) || m.label.toLowerCase().includes(q)
    );
  }, [query]);

  const onToggle = (code: string) => composer.toggleMood(code);

  return (
    <Modal
      visible={composer.moodPickerVisible}
      animationType="slide"
      onRequestClose={composer.hideMoodPicker}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md }}>
          <Text
            style={{
              color: colors.text,
              fontSize: fontSizes.lg,
              fontWeight: "700",
              marginBottom: spacing.sm,
            }}
          >
            Select moods
          </Text>
          <TextInput
            placeholder="Search moods"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={{
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.outline,
              backgroundColor: colors.input,
              color: colors.text,
              borderRadius: radii.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              marginBottom: spacing.md,
            }}
          />

          <FlatList
            data={filtered}
            keyExtractor={(i) => i.code}
            renderItem={({ item }) => {
              const selected = composer.moods.includes(item.code);
              return (
                <TouchableOpacity
                  onPress={() => onToggle(item.code)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.outline,
                    backgroundColor: selected
                      ? colors.primary + "22"
                      : colors.surface,
                    borderRadius: radii.sm,
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      marginRight: 10,
                      backgroundColor: item.color,
                      borderWidth: 1,
                      borderColor: colors.outline,
                    }}
                  />
                  <Text style={{ color: colors.text, flex: 1 }}>
                    {item.label}
                  </Text>
                  {selected && (
                    <Text style={{ color: colors.primary, fontWeight: "600" }}>
                      Selected
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={composer.clearMoods}
              style={{
                padding: spacing.sm,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderColor: colors.outline,
              }}
            >
              <Text style={{ color: colors.text }}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={composer.hideMoodPicker}
              style={{
                padding: spacing.sm,
                borderRadius: radii.sm,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
