// mobile/src/components/AuthForm.tsx
import React, { ReactNode, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardTypeOptions,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

export interface Field {
  key: string;
  label?: string;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  textContentType?: "emailAddress" | "password" | "username" | "name";
}

interface Props {
  header?: string;
  fields: Field[];
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: Record<string, string>) => Promise<any>;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  footer?: ReactNode;
}

export default function AuthForm({
  header,
  fields,
  submitLabel,
  submitting,
  onSubmit,
  secondaryLabel,
  onSecondaryPress,
  footer,
}: Props) {
  const { colors } = useTheme();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ""]))
  );

  const handleChange = (key: string, text: string) => {
    setValues((v) => ({ ...v, [key]: text }));
  };

  const handleSubmit = () => {
    onSubmit(values);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header && (
        <Text style={[styles.header, { color: colors.text }]}>{header}</Text>
      )}
      {fields.map((f, idx) => (
        <TextInput
          key={f.key}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder={f.placeholder || f.label}
          placeholderTextColor={colors.text + "99"}
          secureTextEntry={f.secure}
          keyboardType={f.keyboardType}
          value={values[f.key]}
          onChangeText={(t) => handleChange(f.key, t)}
          editable={!submitting}
          textContentType={f.textContentType}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          returnKeyType={idx === fields.length - 1 ? "done" : "next"}
          onSubmitEditing={() => {
            if (idx === fields.length - 1) {
              handleSubmit(); // last field -> submit
            }
          }}
          blurOnSubmit={idx === fields.length - 1}
        />
      ))}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          submitting && styles.disabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>

      {secondaryLabel && onSecondaryPress && (
        <TouchableOpacity onPress={onSecondaryPress}>
          <Text style={[styles.link, { color: colors.primary }]}>
            {secondaryLabel}
          </Text>
        </TouchableOpacity>
      )}

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  header: { fontSize: 24, marginBottom: 16, textAlign: "center" },
  input: { borderWidth: 1, borderRadius: 4, padding: 12, marginBottom: 12 },
  button: {
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginVertical: 12,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16 },
  link: { textAlign: "center", marginTop: 8 },
});
