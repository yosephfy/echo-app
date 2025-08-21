import { create } from "zustand";
import SecureStorage from "expo-secure-store";
import { api } from "../api/client";

type SettingType = "boolean" | "string" | "integer" | "json" | "enum";

export type SettingOption = { value: string; label: string };

export type SettingDefinition = {
  key: string;
  section: string;
  type: SettingType;
  defaultValue?: string | null; // serialized string or JSON string
  metadata?: {
    label?: string;
    description?: string;
    options?: SettingOption[]; // for enum
    [k: string]: any;
  } | null;
};

export type EffectiveSetting = {
  key: string;
  section: string;
  type: SettingType;
  value: any; // already decoded by server (boolean/number/string/object)
  metadata?: SettingDefinition["metadata"];
};

type SettingsState = {
  loading: boolean;
  error: string | null;

  definitions: Record<string, SettingDefinition>; // keyed by def.key
  bySection: Record<string, string[]>; // section -> [keys]
  effective: Record<string, any>; // key -> effective value
  version: string | number | null; // optional ETag/semantic version

  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  setSetting: (key: string, next: any) => Promise<void>;
  bulkSet: (items: Array<{ key: string; value: any }>) => Promise<void>;
  clear: () => Promise<void>;
};

const CACHE_KEY = "settings_cache_v1";

async function loadCache() {
  try {
    const raw = await SecureStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function saveCache(payload: {
  definitions: Record<string, SettingDefinition>;
  bySection: Record<string, string[]>;
  effective: Record<string, any>;
  version: string | number | null;
}) {
  try {
    await SecureStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {}
}
async function clearCache() {
  try {
    await SecureStorage.deleteItemAsync(CACHE_KEY);
  } catch {}
}

function indexBySection(defs: SettingDefinition[]) {
  const bySection: Record<string, string[]> = {};
  for (const d of defs) {
    if (!bySection[d.section]) bySection[d.section] = [];
    bySection[d.section].push(d.key);
  }
  for (const k of Object.keys(bySection)) {
    bySection[k].sort((a, b) => a.localeCompare(b));
  }
  return bySection;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loading: true,
  error: null,

  definitions: {},
  bySection: {},
  effective: {},
  version: null,

  // load from cache immediately, then refresh from server
  hydrate: async () => {
    set({ loading: true, error: null });
    const cached = await loadCache();
    if (cached) {
      set({
        definitions: cached.definitions || {},
        bySection: cached.bySection || {},
        effective: cached.effective || {},
        version: cached.version ?? null,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
    // Refresh live in background
    await get().refresh();
  },

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const [defs, effective] = await Promise.all([
        api.get<SettingDefinition[]>("/settings/definitions"),
        api.get<EffectiveSetting[]>("/settings/me"),
      ]);
      const byKey: Record<string, SettingDefinition> = {};
      for (const d of defs) byKey[d.key] = d;
      const bySection = indexBySection(defs);
      const eff: Record<string, any> = {};
      for (const e of effective) eff[e.key] = e.value;

      const version = Date.now(); // replace with ETag/header if you add one

      set({
        definitions: byKey,
        bySection,
        effective: eff,
        version,
        loading: false,
        error: null,
      });
      await saveCache({
        definitions: byKey,
        bySection,
        effective: eff,
        version,
      });
    } catch (err: any) {
      set({
        loading: false,
        error: err?.message ?? "Failed to refresh settings",
      });
    }
  },

  setSetting: async (key, next) => {
    const state = get();
    const prev = state.effective[key];
    // optimistic update
    set({ effective: { ...state.effective, [key]: next } });
    try {
      // server expects string (or JSON-string) – service handles coercion
      const serialized =
        typeof next === "object"
          ? JSON.stringify(next)
          : typeof next === "boolean"
            ? next
              ? "true"
              : "false"
            : String(next);

      await api.patch("/settings/me", { key, value: serialized });

      // persist cache
      const { definitions, bySection, effective, version } = get();
      await saveCache({ definitions, bySection, effective, version });
    } catch (err) {
      // revert on error
      const { effective } = get();
      const reverted = { ...effective, [key]: prev };
      set({ effective: reverted });
      const { definitions, bySection, version } = get();
      await saveCache({ definitions, bySection, effective: reverted, version });
      throw err;
    }
  },

  bulkSet: async (items) => {
    const state = get();
    const prev: Record<string, any> = {};
    for (const { key } of items) prev[key] = state.effective[key];
    // optimistic apply
    const nextEff = { ...state.effective };
    for (const { key, value } of items) nextEff[key] = value;
    set({ effective: nextEff });

    try {
      const body = {
        items: items.map(({ key, value }) => ({
          key,
          value:
            typeof value === "object"
              ? JSON.stringify(value)
              : typeof value === "boolean"
                ? value
                  ? "true"
                  : "false"
                : String(value),
        })),
      };
      await api.patch("/settings/me/bulk", body);

      const { definitions, bySection, effective, version } = get();
      await saveCache({ definitions, bySection, effective, version });
    } catch (err) {
      // revert
      set({ effective: { ...state.effective, ...prev } });
      const { definitions, bySection, effective, version } = get();
      await saveCache({ definitions, bySection, effective, version });
      throw err;
    }
  },

  clear: async () => {
    set({
      loading: false,
      error: null,
      definitions: {},
      bySection: {},
      effective: {},
      version: null,
    });
    await clearCache();
  },
}));
