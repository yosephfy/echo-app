import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { IconSvg } from "../icons/IconSvg";
import { IconName } from "../icons/icons";

export type ReactionItem = {
  key: string;
  title?: string;
  icon: IconName;
};

export const DEFAULT_REACTIONS: ReactionItem[] = [
  { key: "love", title: "Love", icon: "heart-full" },
  { key: "like", title: "Like", icon: "thumbs-up" },
  { key: "haha", title: "Haha", icon: "face-with-tears-of-joy" },
  { key: "wow", title: "Wow", icon: "face-screaming-in-fear" },
  { key: "sad", title: "Sad", icon: "sad-but-relieved-face" },
];

export function getDefaultReactionIcon(key: string): IconName | undefined {
  return DEFAULT_REACTIONS.find((r) => r.key === key)?.icon;
}

export type ReactionPickerProps = {
  items?: ReactionItem[];
  value?: string | null;
  onSelect: (key: string) => void;
  activation?: "press" | "longPress";
  showTitles?: boolean;
  itemSize?: number;
  closeOnSelect?: boolean;
  placement?: "auto" | "top" | "bottom";
  children: React.ReactElement;
};

/**
 * ReactionPicker
 * - Wraps any child (anchor) and shows a themed popover near it on long-press (or press).
 * - Positions above/below automatically, clamps within screen, wraps icons to avoid overflow.
 * - Closes on outside press or selection.
 */
export default function ReactionPicker({
  items,
  value,
  onSelect,
  activation = "longPress",
  showTitles = false,
  itemSize = 28,
  closeOnSelect = true,
  placement = "auto",
  children,
}: ReactionPickerProps) {
  const { colors, radii, spacing, elevations } = useTheme();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [content, setContent] = useState<{ w: number; h: number } | null>(null);
  const anchorRef = useRef<View>(null);

  const openPicker = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setOpen(true);
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Clone child and attach activation handler
  const child = useMemo(() => {
    const firstKey = (items ?? DEFAULT_REACTIONS)[0]?.key;
    const handleQuickPress = () => {
      if (!firstKey) return;
      onSelect(firstKey);
      if (closeOnSelect) setOpen(false);
    };
    const props: any = {
      ref: anchorRef,
      onLongPress: activation === "longPress" ? openPicker : undefined,
      onPress: activation === "press" ? openPicker : handleQuickPress,
      delayLongPress: 150,
    };
    return (
      <View ref={anchorRef as any} collapsable={false}>
        {React.cloneElement(children, props)}
      </View>
    );
  }, [children, activation, openPicker, items, onSelect, closeOnSelect]);

  const overlay = useMemo(() => {
    if (!open || !anchor) return null;
    const M = 10; // margin to edges
    const win = Dimensions.get("window");

    // Decide top/bottom
    const preferTop =
      placement === "top" ||
      (placement === "auto" && anchor.y > win.height / 2);

    // Default position around anchor center; we'll clamp after content measures
    let left = Math.max(M, anchor.x + anchor.w / 2 - (content?.w ?? 0) / 2);
    let top = preferTop
      ? anchor.y - (content?.h ?? 0) - 8
      : anchor.y + anchor.h + 8;

    // Clamp after we know content size
    if (content) {
      left = Math.min(Math.max(M, left), win.width - M - content.w);
      if (preferTop && top < M) top = M; // clamp top
      if (!preferTop && top + content.h > win.height - M)
        top = win.height - M - content.h;
    }

    const onLayoutContent = (e: any) => {
      const { width, height } = e.nativeEvent.layout;
      setContent({ w: width, h: height });
    };

    return (
      <Modal visible transparent animationType="fade" onRequestClose={close}>
        {/* Outside tap closes */}
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View
          style={{ position: "absolute", left, top }}
          onLayout={!content ? onLayoutContent : undefined}
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: colors.surface,
                borderColor: colors.outline,
                borderRadius: radii.lg,
                shadowColor: "#000",
                elevation: elevations.md,
              },
            ]}
          >
            <View
              style={{
                maxWidth: Dimensions.get("window").width - M * 2,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                padding: spacing.sm,
                justifyContent: "center",
              }}
            >
              {(items ?? DEFAULT_REACTIONS).map((it) => {
                const active = value === it.key;
                return (
                  <TouchableOpacity
                    key={it.key}
                    onPress={() => {
                      onSelect(it.key);
                      if (closeOnSelect) close();
                    }}
                    style={{ alignItems: "center", minWidth: itemSize + 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={it.title || it.key}
                  >
                    <View
                      style={{
                        padding: 6,
                        borderRadius: 999,
                        //borderWidth: active ? 2 : 1,
                        borderColor: active ? colors.primary : colors.outline,
                        backgroundColor: active
                          ? colors.primary + "22"
                          : "transparent",
                      }}
                    >
                      <IconSvg
                        icon={it.icon}
                        size={active ? itemSize + 4 : itemSize}
                      />
                    </View>
                    {showTitles && (
                      <Text
                        style={{
                          marginTop: 4,
                          color: colors.muted,
                          fontSize: 12,
                        }}
                      >
                        {it.title ?? it.key}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  }, [
    open,
    anchor,
    content,
    colors,
    radii,
    elevations,
    items,
    value,
    itemSize,
    showTitles,
    placement,
    closeOnSelect,
    onSelect,
    close,
  ]);

  return (
    <>
      {child}
      {overlay}
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
