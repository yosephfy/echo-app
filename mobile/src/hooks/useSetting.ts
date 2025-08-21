import { useMemo } from "react";
import { useSettingsStore } from "../store/settingsStore";

/**
 * Usage:
 *  const [value, setValue, meta] = useSetting("appearance.theme");
 *  setValue("dark");
 */
export function useSetting<T = any>(
  key: string
): [
  T | undefined,
  (next: T) => Promise<void>,
  {
    loading: boolean;
    type?: "boolean" | "string" | "integer" | "json" | "enum";
    label?: string;
    defaultValue?: string | null | undefined;
    description?: string;
    options?: { value: string; label: string }[];
    section?: string;
  },
] {
  const loading = useSettingsStore((s) => s.loading);
  const def = useSettingsStore((s) => s.definitions[key]);
  const value = useSettingsStore((s) => s.effective[key]) as T | undefined;
  const setSetting = useSettingsStore((s) => s.setSetting);

  const meta = useMemo(() => {
    return {
      loading,
      type: def?.type,
      label: def?.metadata?.label,
      defaultValue: def?.defaultValue,
      description: def?.metadata?.description,
      options: def?.metadata?.options,
      section: def?.section,
    };
  }, [loading, def]);

  return [value, (v: T) => setSetting(key, v), meta];
}
