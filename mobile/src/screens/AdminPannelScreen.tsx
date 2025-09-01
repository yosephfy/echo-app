import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { api } from "../api/client";
import { useTheme } from "../theme/ThemeContext";

type ReviewItem = {
  id: string;
  secret: { text: string };
};

export default function AdminPanelScreen() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const { colors } = useTheme();

  useEffect(() => {
    api.get("/admin/reports").then((res: any) => setItems(res ?? []));
  }, []);

  const resolve = async (id: string, action: "approve" | "remove") => {
    await api.post(`/admin/reports/${id}`, { action });
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        //keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              { borderBottomColor: colors.outline, backgroundColor: colors.surface },
            ]}
          >
            <Text style={{ color: colors.text }}>{item.secret.text}</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => resolve(item.id, "approve")}>
                <Text style={[styles.approve, { color: colors.success }]}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => resolve(item.id, "remove")}>
                <Text style={[styles.remove, { color: colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  approve: {},
  remove: {},
});
