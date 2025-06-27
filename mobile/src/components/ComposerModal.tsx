import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { api } from "../api/client";

interface Props {
  visible: boolean;
  onClose: () => void;
  onPosted: () => void;
}

const MAX_CHARS = 2000;
const RADIUS = 40;
const STROKE_WIDTH = 6;
const CIRCLE_CIRC = 2 * Math.PI * RADIUS;

export default function ComposerModal({ visible, onClose, onPosted }: Props) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [panic, setPanic] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch cooldown seconds whenever modal opens or after post
  const fetchQuota = async () => {
    const { secondsRemaining } = await api.get<{ secondsRemaining: number }>(
      "/secrets/quota"
    );
    setSeconds(secondsRemaining);
  };

  useEffect(() => {
    if (visible) {
      fetchQuota();
    }
  }, [visible]);

  const postSecret = async () => {
    setLoading(true);
    try {
      await api.post("/secrets", { text, mood });
      setText("");
      setMood(undefined);
      setPanic(false);
      onPosted();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
      fetchQuota();
    }
  };

  // Derived values for circle progress
  const progress = seconds / (24 * 60 * 60);
  const strokeDashoffset = CIRCLE_CIRC * (1 - progress);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.label}>Compose your secret</Text>

        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          multiline
          maxLength={MAX_CHARS}
          value={text}
          onChangeText={setText}
          editable={seconds === 0 && !loading}
        />
        <Text style={styles.charCount}>
          {text.length} / {MAX_CHARS}
        </Text>

        {/* Mood selector */}
        <View style={styles.moodRow}>
          {["happy", "sad", "angry", "relieved"].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.moodButton, mood === m && styles.moodSelected]}
              onPress={() => setMood(m)}
            >
              <Text style={styles.moodText}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Panic-delete toggle */}
        <View style={styles.panicRow}>
          <Text>Enable Panic Delete</Text>
          <TouchableOpacity onPress={() => setPanic((p) => !p)}>
            <Text style={{ color: panic ? "red" : "gray" }}>
              {panic ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cooldown ring */}
        <Svg width={100} height={100} style={styles.ring}>
          <Circle
            cx={50}
            cy={50}
            r={RADIUS}
            stroke="#eee"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={50}
            cy={50}
            r={RADIUS}
            stroke="#0066CC"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCLE_CIRC}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin="50,50"
          />
          {seconds > 0 && (
            <Text style={styles.ringText}>{Math.ceil(seconds / 3600)}h</Text>
          )}
        </Svg>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancel} onPress={onClose}>
            <Text>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.post,
              (seconds > 0 || !text.trim() || loading) && styles.disabled,
            ]}
            onPress={postSecret}
            disabled={seconds > 0 || !text.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.postText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "flex-start" },
  label: { fontSize: 18, marginBottom: 12 },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
  },
  charCount: { textAlign: "right", marginBottom: 12, color: "#666" },
  moodRow: { flexDirection: "row", marginBottom: 12 },
  moodButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#0066CC",
    borderRadius: 4,
    marginRight: 8,
  },
  moodSelected: { backgroundColor: "#0066CC" },
  moodText: { color: "#0066CC" },
  panicRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  ring: { alignSelf: "center", marginBottom: 24 },
  ringText: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancel: { padding: 12 },
  post: {
    backgroundColor: "#0066CC",
    padding: 12,
    borderRadius: 4,
  },
  disabled: { backgroundColor: "#888" },
  postText: { color: "#fff" },
});
