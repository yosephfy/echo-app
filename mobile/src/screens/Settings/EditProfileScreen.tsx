import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Avatar from "../../components/Avatar";
import { SettingsRow } from "../../components/SettingRow";
import useMe from "../../hooks/useMe";
import { useTheme } from "../../theme/ThemeContext";
import { sanitizeHandle, sanitizeText } from "../../utils/sanitize";
import { StorageKind, uploadFile } from "../../utils/storage";
import { useSetting } from "../../hooks/useSetting";

export default function EditProfileScreen() {
  const { colors } = useTheme();

  // Me (profile)
  const { user, loading: meLoading, updating, updateProfile } = useMe();

  // Settings via useSetting(key)
  const [showReactionCounts, setShowReactionCounts, showReactionCountsMeta] =
    useSetting<boolean>("privacy.showReactionCounts");

  // Local input state (pre-populate from me)
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined | null>(
    user?.avatarUrl ?? null
  );
  const [uploading, setUploading] = useState(false);

  // Keep inputs in sync when me changes
  React.useEffect(() => {
    if (!user) return;
    setHandle(user.handle ?? "");
    setBio(user.bio ?? "");
    setAvatarUrl(user.avatarUrl ?? null);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = meLoading || showReactionCountsMeta.loading;

  // Validation helpers
  const canSaveHandle = useMemo(() => {
    const cleaned = sanitizeHandle(handle || "");
    return cleaned.length >= 3 && cleaned.length <= 20;
  }, [handle]);

  // Avatar flow
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need access to your photos to set your avatar."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    try {
      setUploading(true);
      // local preview
      setAvatarUrl(uri);
      // upload -> URL
      const { url } = await uploadFile(
        { localUri: uri },
        {
          kind: StorageKind.AVATAR,
          overwrite: true,
          ids: { userId: user?.id },
          transform: { quality: 0.6 },
        }
      );
      // persist
      await updateProfile({ avatarUrl: url });
      Alert.alert("Updated", "Your avatar has been updated.");
    } catch (e: any) {
      setAvatarUrl(user?.avatarUrl ?? null);
      Alert.alert("Upload failed", e?.message ?? "Could not upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  const randomizeAvatar = async () => {
    try {
      setUploading(true);
      // if you have a dedicated endpoint, call it; otherwise server can randomize on patch
      const updated = await updateProfile({ avatarUrl: null });
      if (updated?.avatarUrl) setAvatarUrl(updated.avatarUrl);
      Alert.alert("Updated", "New avatar generated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not randomize avatar.");
    } finally {
      setUploading(false);
    }
  };

  // Profile fields
  const submitHandle = async (raw: string) => {
    const next = sanitizeHandle(raw);
    if (!next || next === user?.handle) return;
    if (!canSaveHandle) {
      Alert.alert("Invalid handle", "Handle must be between 3–20 characters.");
      return;
    }
    try {
      await updateProfile({ handle: next });
      setHandle(next);
      Alert.alert("Updated", "Your handle has been updated.");
    } catch (e: any) {
      Alert.alert(
        "Handle not updated",
        e?.message ?? "Please try another handle."
      );
    }
  };

  const submitBio = async (raw: string) => {
    const next = sanitizeText(raw);
    try {
      await updateProfile({ bio: next });
      setBio(next);
      Alert.alert("Updated", "Your bio has been updated.");
    } catch (e: any) {
      Alert.alert("Bio not updated", e?.message ?? "Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Avatar
          handle={user?.handle ?? ""}
          url={avatarUrl ?? undefined}
          size={120}
          ring
          loading={uploading}
        />
        <View style={{ flex: 1, alignItems: "center" }}>
          <SettingsRow
            type="button"
            label={uploading ? "Uploading…" : "Change"}
            icon="image-square"
            options={{ onPress: uploading || updating ? () => {} : pickImage }}
            disabled={uploading || updating}
          />
          <SettingsRow
            type="button"
            label="Randomize"
            icon="shuffle"
            options={{
              onPress: uploading || updating ? () => {} : randomizeAvatar,
            }}
            disabled={uploading || updating}
          />
        </View>
      </View>

      {/* Handle */}
      <SettingsRow
        type="input"
        label="Handle"
        options={{
          value: handle,
          placeholder: "your_handle",
          onSubmit: submitHandle,
        }}
        disabled={updating}
      />

      {/* Bio */}
      <SettingsRow
        type="input"
        label="Bio"
        options={{
          value: bio || "",
          placeholder: "Say something short (max 300 chars)",
          onSubmit: submitBio,
        }}
        disabled={updating}
      />

      {/* Divider */}
      <View
        style={{
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginVertical: 20,
        }}
      />

      {/* Settings via useSetting */}
      <SettingsRow
        type="switch"
        label={
          showReactionCountsMeta.label ?? "Show reaction counts on my profile"
        }
        options={{
          value: !!showReactionCounts,
          onValueChange: async (v: boolean) => {
            try {
              await setShowReactionCounts(v);
            } catch (e: any) {
              Alert.alert(
                "Not saved",
                e?.message ?? "Could not update setting."
              );
            }
          },
        }}
        disabled={showReactionCountsMeta.loading}
      />

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
  },
});
