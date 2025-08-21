// mobile/src/scripts/seedSettings.ts

import { api } from "../api/client";

type SettingType = "boolean" | "string" | "integer" | "json" | "enum";

function serializeDefault(type: SettingType, value: any): string | undefined {
  if (value === undefined) return undefined;
  if (type === "json") return JSON.stringify(value);
  if (type === "boolean") return value ? "true" : "false";
  if (type === "integer") return String(Number(value));
  return String(value);
}

export async function seedSettingsDefinitions() {
  // -------------------------
  // APPEARANCE (AppearanceScreen)
  // -------------------------
  const appearance = [
    {
      key: "appearance.theme",
      section: "appearance",
      type: "enum" as const,
      defaultValue: "system",
      metadata: {
        label: "Appearance",
        description: "Choose the app’s color theme.",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ],
      },
    },
    {
      key: "appearance.fontSize",
      section: "appearance",
      type: "enum" as const,
      defaultValue: "medium",
      metadata: {
        label: "Text Size",
        description: "Adjust the base font size.",
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
    },
    {
      key: "appearance.reduceMotion",
      section: "appearance",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Reduce Animation",
        description: "Minimize animations and motion effects.",
      },
    },
  ];

  // -------------------------
  // PRIVACY (PrivacyScreen)
  // -------------------------
  const privacy = [
    {
      key: "privacy.showInDiscover",
      section: "privacy",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Show in Discover",
        description: "Allow your profile to appear in Discover.",
      },
    },
    {
      key: "privacy.showActivity",
      section: "privacy",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Show activity on profile",
        description: "Show when you were last active.",
      },
    },
    {
      key: "privacy.allowReplies",
      section: "privacy",
      type: "enum" as const,
      defaultValue: "everyone",
      metadata: {
        label: "Who can reply",
        description: "Set who can reply to your posts.",
        options: [
          { value: "everyone", label: "Everyone" },
          { value: "followers", label: "Followers" },
          { value: "none", label: "No one" },
        ],
      },
    },
    {
      key: "privacy.showReactionCounts",
      section: "privacy",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Show reaction counts",
        description: "Display total reactions on posts.",
      },
    },
    {
      key: "privacy.blurSensitive",
      section: "privacy",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Blur sensitive content",
        description: "Blur content that may be sensitive by default.",
      },
    },
    // UI shows a navigation page, but store it as JSON string to back that UI
    {
      key: "privacy.mutedKeywords",
      section: "privacy",
      type: "json" as const,
      defaultValue: [],
      metadata: {
        label: "Muted keywords",
        description: "List of muted words/phrases to filter from your feed.",
        schema: { type: "array", items: "string" },
        placeholder: "Add words or phrases…",
      },
    },
  ];

  // -------------------------
  // NOTIFICATIONS (NotificationsScreen)
  // -------------------------
  const notifications = [
    {
      key: "notifications.push.enabled",
      section: "notifications",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Enable Push Notifications",
        description: "Receive push notifications from Echo.",
      },
    },
    {
      key: "notifications.push.posts",
      section: "notifications",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Notifications about my Posts",
        description: "Get notified when there is activity on your posts.",
      },
    },
    {
      key: "notifications.push.comments",
      section: "notifications",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Notifications about my Comments",
        description: "Get notified when someone replies to your comments.",
      },
    },
    {
      key: "notifications.dailyReminder",
      section: "notifications",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Daily Reminder",
        description: "Send a daily reminder to check in.",
      },
    },
  ];

  const all = [...appearance, ...privacy, ...notifications];

  for (const def of all) {
    const payload = {
      key: def.key,
      section: def.section,
      type: def.type,
      defaultValue: serializeDefault(def.type, def.defaultValue),
      metadata: def.metadata ?? undefined,
      isDeprecated: false,
    };
    try {
      await api.post("/settings/definitions", payload);
      console.log("Upserted:", def.key);
    } catch (err: any) {
      console.error("Failed to upsert", def.key, "-", err.message);
    }
  }

  console.log("✅ Settings definitions seeded.");
}
