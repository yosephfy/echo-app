// mobile/src/scripts/seedSettings.ts
import { api } from "../api/client";

/**
 * Helper to stringify default values according to type.
 * - boolean/integer => string form
 * - enum/string     => string as-is
 * - json            => JSON.stringify(value)
 */
function serializeDefault(
  type: "boolean" | "string" | "integer" | "json" | "enum",
  value: any
): string | undefined {
  if (value === undefined) return undefined;
  if (type === "json") return JSON.stringify(value);
  if (type === "boolean") return value ? "true" : "false";
  if (type === "integer") return String(Number(value));
  // string/enum pass through
  return String(value);
}

/**
 * Seeds/Upserts all setting definitions your app needs.
 * Run once (or anytime you add new definitions).
 */
export async function seedSettingsDefinitions() {
  // --- NOTIFICATIONS ---
  const notifications = [
    {
      key: "notifications.push.enabled",
      section: "notifications",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Enable Notifications",
        description: "Receive push notifications from Echo.",
      },
    },
    {
      key: "notifications.push.replies",
      section: "notifications",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Replies to my secret",
        description: "Alert me when someone replies to my posts.",
      },
    },
    {
      key: "notifications.push.mentions",
      section: "notifications",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Mentions",
        description: "Notify me when I’m mentioned.",
      },
    },
    {
      key: "notifications.push.weeklyDigest",
      section: "notifications",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Weekly digest",
        description: "Get a weekly summary.",
      },
    },
    {
      key: "notifications.quietHours",
      section: "notifications",
      type: "json" as const,
      defaultValue: { start: "22:00", end: "07:00", enabled: false },
      metadata: {
        label: "Quiet hours",
        description: "Mute notifications during a time range.",
        schema: { start: "HH:mm", end: "HH:mm", enabled: "boolean" },
      },
    },
  ];

  // --- APPEARANCE ---
  const appearance = [
    {
      key: "appearance.theme",
      section: "appearance",
      type: "enum" as const,
      defaultValue: "system",
      metadata: {
        label: "Theme",
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
        label: "Font size",
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
    },
    {
      key: "appearance.contrast",
      section: "appearance",
      type: "enum" as const,
      defaultValue: "normal",
      metadata: {
        label: "Contrast",
        options: [
          { value: "normal", label: "Normal" },
          { value: "high", label: "High" },
        ],
      },
    },
  ];

  // --- PRIVACY ---
  const privacy = [
    {
      key: "privacy.profileVisibility",
      section: "privacy",
      type: "enum" as const,
      defaultValue: "public",
      metadata: {
        label: "Profile visibility",
        options: [
          { value: "public", label: "Public" },
          { value: "followers", label: "Followers" },
          { value: "private", label: "Private" },
        ],
      },
    },
    {
      key: "privacy.allowReplies",
      section: "privacy",
      type: "enum" as const,
      defaultValue: "everyone",
      metadata: {
        label: "Who can reply",
        options: [
          { value: "everyone", label: "Everyone" },
          { value: "followers", label: "Followers" },
          { value: "none", label: "No one" },
        ],
      },
    },
    {
      key: "privacy.allowMentions",
      section: "privacy",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Allow mentions",
      },
    },
    {
      key: "privacy.showActivity",
      section: "privacy",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Show activity",
        description: "Allow others to see when you are active.",
      },
    },
  ];

  // --- SECURITY ---
  const security = [
    {
      key: "security.loginAlerts",
      section: "security",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Login alerts",
        description: "Notify on new device sign-ins.",
      },
    },
    {
      key: "security.twoFactor",
      section: "security",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Two-factor authentication",
        description: "Require a second factor when logging in.",
      },
    },
    {
      key: "security.requireBiometric",
      section: "security",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Require biometrics",
        description: "Use Face/Touch ID for sensitive actions.",
      },
    },
  ];

  // --- CONTENT (feed & filters) ---
  const content = [
    {
      key: "content.feed.moodFilter",
      section: "content",
      type: "enum" as const,
      defaultValue: "any",
      metadata: {
        label: "Mood filter",
        options: [
          { value: "any", label: "Any" },
          { value: "happy", label: "Happy" },
          { value: "sad", label: "Sad" },
          { value: "angry", label: "Angry" },
          { value: "relieved", label: "Relieved" },
        ],
      },
    },
    {
      key: "content.feed.hideSensitive",
      section: "content",
      type: "boolean" as const,
      defaultValue: true,
      metadata: {
        label: "Hide sensitive content",
      },
    },
    {
      key: "content.autoplayMedia",
      section: "content",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Autoplay media",
      },
    },
  ];

  // --- ACCESSIBILITY ---
  const accessibility = [
    {
      key: "accessibility.reduceMotion",
      section: "accessibility",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Reduce motion",
      },
    },
    {
      key: "accessibility.reduceTransparency",
      section: "accessibility",
      type: "boolean" as const,
      defaultValue: false,
      metadata: {
        label: "Reduce transparency",
      },
    },
  ];

  const all = [
    ...notifications,
    ...appearance,
    ...privacy,
    ...security,
    ...content,
    ...accessibility,
  ];

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
