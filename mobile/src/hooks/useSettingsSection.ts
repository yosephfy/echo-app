import { useMemo } from "react";
import { useSettingsStore } from "../store/settingsStore";

/**
 * Returns all definitions + effective values for a section
 * so you can render rows data-driven if you want.
 */
export function useSettingsSection(section: string) {
  const loading = useSettingsStore((s) => s.loading);
  const keys = useSettingsStore((s) => s.bySection[section] || []);
  const defs = useSettingsStore((s) => s.definitions);
  const eff = useSettingsStore((s) => s.effective);

  return useMemo(() => {
    const items = keys.map((k) => ({
      key: k,
      definition: defs[k],
      value: eff[k],
    }));
    return { loading, items };
  }, [loading, keys, defs, eff]);
}
