// Shared mood catalog: codes must align with backend
export type MoodDef = {
  code: string;
  label: string;
  color: string;
  category?: string;
};

export const MOODS: MoodDef[] = [
  { code: "happy", label: "Happy", color: "#FFC107" },
  { code: "sad", label: "Sad", color: "#2196F3" },
  { code: "angry", label: "Angry", color: "#F44336" },
  { code: "relieved", label: "Relieved", color: "#4CAF50" },
  { code: "anxious", label: "Anxious", color: "#9C27B0" },
  { code: "hopeful", label: "Hopeful", color: "#FF9800" },
  { code: "lonely", label: "Lonely", color: "#795548" },
  { code: "grateful", label: "Grateful", color: "#8BC34A" },
  { code: "stressed", label: "Stressed", color: "#E91E63" },
  { code: "tired", label: "Tired", color: "#607D8B" },
];

export const MOOD_COLOR_MAP = Object.fromEntries(
  MOODS.map((m) => [m.code, m.color])
) as Record<string, string>;
