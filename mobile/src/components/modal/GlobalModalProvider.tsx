import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export type GlobalModalOption = {
  label: string;
  onPress: () => void | Promise<void>;
  destructive?: boolean;
};

export type GlobalModalPayload = {
  title?: string;
  message?: string | React.ReactNode;
  options?: GlobalModalOption[];
  cancelText?: string;
  showClose?: boolean;
  // for custom completely overridden body
  renderBody?: (close: () => void) => React.ReactNode;
};

interface GlobalModalContextShape {
  show: (payload: GlobalModalPayload) => void;
  hide: () => void;
  isVisible: boolean;
  /** Promise based confirm helper. Resolves true if primary/affirmative chosen, false if cancelled */
  confirm: (params: {
    title?: string;
    message?: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }) => Promise<boolean>;
}

const GlobalModalContext = createContext<GlobalModalContextShape | undefined>(
  undefined
);

export const GlobalModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const payloadRef = useRef<GlobalModalPayload | null>(null);
  const pendingPromiseRef = useRef<{ resolve: (v: boolean) => void } | null>(
    null
  );
  const [, force] = useState(0);

  const hide = useCallback(() => {
    setVisible(false);
    // if a confirm is pending and user dismissed via backdrop/back button we treat as cancel
    if (pendingPromiseRef.current) {
      pendingPromiseRef.current.resolve(false);
      pendingPromiseRef.current = null;
    }
  }, []);

  const show = useCallback((p: GlobalModalPayload) => {
    payloadRef.current = p;
    force((x) => x + 1);
    setVisible(true);
  }, []);

  const confirm = useCallback(
    (params: {
      title?: string;
      message?: string | React.ReactNode;
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
    }) => {
      return new Promise<boolean>((resolve) => {
        pendingPromiseRef.current = { resolve };
        show({
          title: params.title,
          message: params.message,
          options: [
            {
              label: params.confirmText || "OK",
              destructive: params.destructive,
              onPress: () => {
                resolve(true);
                pendingPromiseRef.current = null;
              },
            },
          ],
          cancelText: params.cancelText || "Cancel",
        });
      });
    },
    [show]
  );

  const value = useMemo(
    () => ({ show, hide, isVisible: visible, confirm }),
    [show, hide, visible, confirm]
  );
  const payload = payloadRef.current;

  return (
    <GlobalModalContext.Provider value={value}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={hide}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            {payload?.renderBody ? (
              payload.renderBody(hide)
            ) : (
              <>
                {!!payload?.title && (
                  <Text style={[styles.title, { color: colors.text }]}>
                    {payload.title}
                  </Text>
                )}
                {typeof payload?.message === "string" ? (
                  <Text style={[styles.message, { color: colors.text }]}>
                    {payload.message}
                  </Text>
                ) : (
                  (payload?.message ?? null)
                )}
                <ScrollView style={{ maxHeight: 260 }}>
                  {payload?.options?.map((opt) => (
                    <TouchableOpacity
                      key={opt.label}
                      style={styles.option}
                      onPress={async () => {
                        try {
                          await opt.onPress();
                        } finally {
                          hide();
                        }
                      }}
                    >
                      <Text
                        style={{
                          color: opt.destructive ? colors.error : colors.text,
                          fontWeight: opt.destructive ? "600" : "400",
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.cancel} onPress={hide}>
                  <Text style={{ color: colors.primary }}>
                    {payload?.cancelText || "Close"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </GlobalModalContext.Provider>
  );
};

export function useGlobalModal() {
  const ctx = useContext(GlobalModalContext);
  if (!ctx)
    throw new Error("useGlobalModal must be used within GlobalModalProvider");
  return ctx;
}

// Convenience helpers converting existing patterns
export function useReportModalAdapter() {
  const { show } = useGlobalModal();
  return (secretId: string) => {
    show({
      title: "Report Secret",
      options: [
        {
          label: "Spam",
          onPress: () => {
            /* TODO: call report endpoint */
          },
        },
        {
          label: "Inappropriate",
          onPress: () => {
            /* TODO */
          },
        },
        {
          label: "Harassment",
          onPress: () => {
            /* TODO */
          },
        },
        {
          label: "Other",
          onPress: () => {
            /* TODO */
          },
        },
      ],
      cancelText: "Cancel",
    });
  };
}

export function useShareModalAdapter() {
  const { show } = useGlobalModal();
  return (secretId: string) => {
    const link = `https://yourapp.com/secret/${secretId}`;
    show({
      title: "Share Secret",
      options: [
        {
          label: "Native Share",
          onPress: () => {
            /* TODO: integrate Share API */
          },
        },
        {
          label: "Copy Link",
          onPress: () => {
            /* TODO: copy link */
          },
        },
      ],
      cancelText: "Close",
    });
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 24,
  },
  modal: { borderRadius: 10, padding: 18, maxHeight: "80%", width: "100%" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  message: { fontSize: 14, marginBottom: 12 },
  option: { paddingVertical: 10 },
  cancel: { marginTop: 16, alignItems: "center" },
});
