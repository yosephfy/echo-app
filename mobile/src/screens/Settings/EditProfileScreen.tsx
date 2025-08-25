// mobile/src/screens/Settings/EditProfileScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../theme/ThemeContext";
import { api } from "../../api/client";
import {
  sanitizeHandle,
  sanitizeText,
  sanitizeForUrl,
} from "../../utils/sanitize";
import { SettingsRow } from "../../components/SettingRow";
import Avatar from "../../components/Avatar";
import { StorageKind, uploadFile } from "../../utils/storage";
import { useUserStats } from "../../hooks/useProfile";
import { useAuthStore } from "../../store/authStore";
import { getAuth } from "firebase/auth";

type UserSettings = {
  showReactionCounts?: boolean;
  defaultShowMood?: boolean;
  allowRepliesByDefault?: boolean;
};

type MeResponse = {
  handle: string;
  avatarUrl: string;
  bio?: string;
  settings?: UserSettings;
};

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore((s) => s);
  // Profile state
  const [handle, setHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState<string | undefined>(undefined);

  // Settings state (with sane defaults)
  const [settings, setSettings] = useState<UserSettings>({
    showReactionCounts: true,
    defaultShowMood: true,
    allowRepliesByDefault: true,
  });

  // ----- Load current profile -----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await api.get<MeResponse>("/users/me");
        if (!mounted) return;
        setHandle(me.handle ?? "");
        setAvatarUrl(me.avatarUrl ?? "");
        setBio(me.bio ?? undefined);
        setSettings((prev) => ({ ...prev, ...(me.settings ?? {}) }));
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ----- Helpers -----
  const canSaveHandle = useMemo(() => {
    const cleaned = sanitizeHandle(handle || "");
    return cleaned.length >= 3 && cleaned.length <= 20;
  }, [handle]);

  const pickImage = async () => {
    // Ask permission once
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
      setSaving(true);
      const uploadedUrl = await uploadAvatarToBackend(uri, user?.id);
      // Persist new avatar URL
      await api.patch("/users/me/avatar", { avatarUrl: uploadedUrl });
      setAvatarUrl(uploadedUrl);
      Alert.alert("Updated", "Your avatar has been updated.");
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Could not upload avatar.");
    } finally {
      setSaving(false);
    }
  };

  const randomizeAvatar = async () => {
    try {
      setSaving(true);
      const res = await api.post<Partial<MeResponse>>(
        "/users/refresh-profile",
        { avatar: true }
      );
      if (res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
      }
      Alert.alert("Updated", "New avatar generated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not randomize avatar.");
    } finally {
      setSaving(false);
    }
  };

  const submitHandle = async (raw: string) => {
    const next = sanitizeHandle(raw);
    if (!next) return;
    if (next === handle) return;
    if (next.length < 3 || next.length > 20) {
      Alert.alert("Invalid handle", "Handle must be between 3–20 characters.");
      return;
    }

    try {
      setSaving(true);
      await api.patch("/users/me/handle", { handle: next });
      setHandle(next);
      Alert.alert("Updated", "Your handle has been updated.");
    } catch (e: any) {
      Alert.alert(
        "Handle not updated",
        e?.message ?? "Please try another handle."
      );
    } finally {
      setSaving(false);
    }
  };

  const submitBio = async (raw: string) => {
    const next = sanitizeText(raw);
    try {
      setSaving(true);
      await api.patch("/users/me/bio", { bio: next });
      setBio(next);
      Alert.alert("Updated", "Your bio has been updated.");
    } catch (e: any) {
      Alert.alert("Bio not updated", e?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = async <K extends keyof UserSettings>(
    key: K,
    value: boolean
  ) => {
    // optimistic
    const prev = settings[key];
    setSettings((s) => ({ ...s, [key]: value }));
    try {
      await api.patch("/users/me/settings", { [key]: value });
    } catch (e: any) {
      // rollback
      setSettings((s) => ({ ...s, [key]: prev }));
      Alert.alert("Not saved", e?.message ?? "Could not update setting.");
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
      {/* Header: avatar + handle preview */}
      {/* <View style={styles.header}>
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          resizeMode="cover"
        />
        <Text style={[styles.handlePreview, { color: colors.text }]}>
          @{handle}
        </Text>
        {saving ? <ActivityIndicator color={colors.primary} /> : null}
      </View> */}
      <View style={styles.header}>
        <Avatar handle={""} size={120} />
        <View style={{ flex: 1, alignItems: "center", backgroundColor: "" }}>
          <SettingsRow
            type="button"
            label="Change"
            icon="image-square"
            options={{ onPress: pickImage }}
          />
          <SettingsRow
            type="button"
            label="Randomize"
            icon="shuffle"
            options={{ onPress: randomizeAvatar }}
          />
        </View>
      </View>

      {/* Avatar actions */}

      {/* Handle inline edit */}

      <SettingsRow
        type="input"
        label="Handle"
        //icon="at-sign"
        options={{
          value: handle,
          placeholder: "your_handle",
          onSubmit: submitHandle,
        }}
      />

      {/* Bio inline (single-line helper row goes to multi-line editor). 
          If you prefer a dedicated Bio screen, switch this to type="navigation". */}
      <SettingsRow
        type="input"
        label="Bio"
        //icon="pencil"
        options={{
          value: bio || "",
          placeholder: "Say something short (max 300 chars)",
          onSubmit: submitBio,
        }}
      />

      <View
        style={{
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginVertical: 20,
        }}
      />
      <SettingsRow
        type="switch"
        label="Show reaction counts on my profile"
        //icon="heart"
        options={{
          value: !!settings.showReactionCounts,
          onValueChange: (v) => toggleSetting("showReactionCounts", v),
        }}
      />
      <SettingsRow
        type="switch"
        label="Show mood badge on my posts by default"
        //icon="smile"
        options={{
          value: !!settings.defaultShowMood,
          onValueChange: (v) => toggleSetting("defaultShowMood", v),
        }}
      />
      <SettingsRow
        type="switch"
        label="Allow replies on my posts by default"
        //icon="share"
        options={{
          value: !!settings.allowRepliesByDefault,
          onValueChange: (v) => toggleSetting("allowRepliesByDefault", v),
        }}
      />

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

/**
 * Example avatar upload using multipart/form-data.
 * Replace the endpoint with your backend upload route,
 * then PATCH the returned URL to /users/{uid}/avatar.jpg.
 */
async function uploadAvatarToBackend(
  localUri: string,
  userId?: string
): Promise<string> {
  const { currentUser } = getAuth();
  console.log("Uploading avatar...", currentUser?.uid);
  const { url } = await uploadFile(
    { localUri: localUri },
    {
      kind: StorageKind.AVATAR,
      overwrite: true,
      ids: { userId },
      transform: { quality: 0.5 },
    } // deterministic path
  );
  console.log("Avatar uploaded to:", url);
  api.patch("/users/me/avatar", { avatarUrl: url }).catch((e) => {
    console.warn("Failed to persist avatar URL", e);
  });
  return url;
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
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
    backgroundColor: "#ddd",
  },
  handlePreview: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
});
