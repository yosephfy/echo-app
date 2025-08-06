// mobile/src/components/SettingsRow.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { IconSvg } from "../icons/IconSvg";
import { IconName } from "../icons/icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AccountSettingsStackParamList } from "../navigation/AccountScreenNavigator";

type Props = NativeStackScreenProps<
  AccountSettingsStackParamList,
  "SettingsHome"
>;
// 1) Define the kinds of rows we support
export type RowType =
  | "navigation"
  | "button"
  | "switch"
  | "input"
  | "dropdown"
  | "date";

// 2) Define the options each row type requires
interface NavigationOptions {
  onPress?: () => void;
  navigation: any; // optional navigation prop, can be used for custom logic
  route: keyof AccountSettingsStackParamList; // route name for navigation
  params?: Record<string, any>; // optional params for navigation
}

interface ButtonOptions {
  onPress: () => void;
}

interface SwitchOptions {
  value: boolean;
  onValueChange: (v: boolean) => void;
}

interface InputOptions {
  value: string;
  placeholder?: string;
  onChangeText: (t: string) => void;
}

interface DropdownOptions {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (item: string) => void;
}

interface DateOptions {
  date: Date;
  onChange: (d: Date) => void;
}

// 3) Map each `RowType` to its `options` interface
type OptionsMap = {
  navigation: NavigationOptions;
  button: ButtonOptions;
  switch: SwitchOptions;
  input: InputOptions;
  dropdown: DropdownOptions;
  date: DateOptions;
};

// 4) The generic props type
export type SettingsRowProps<T extends RowType> = {
  type: T;
  label: string;
  disabled?: boolean;
  icon?: IconName; // optional icon for all rows
  // strongly typed options for each type
  options: OptionsMap[T];
};

// 5) The component
export function SettingsRow<T extends RowType>({
  type,
  label,
  disabled = false,
  options,
  icon,
}: SettingsRowProps<T>) {
  //const { navigation } = useNavigation<Props>();

  // shared styles
  const rowStyle = [styles.row, disabled && styles.disabledRow];

  switch (type) {
    case "navigation": {
      const { onPress, route, params, navigation } =
        options as NavigationOptions;
      const onPressHandler = () => {
        onPress?.();
        navigation.navigate(route, params as any);
      };
      return (
        <TouchableOpacity
          style={rowStyle}
          onPress={onPressHandler}
          disabled={disabled}
        >
          {icon && <IconSvg icon={icon} size={20} state="default" />}
          <Text style={styles.label}>{label}</Text>
          <IconSvg icon="chevron-right" size={20} state="default" />
        </TouchableOpacity>
      );
    }

    case "button": {
      const { onPress } = options as ButtonOptions;
      return (
        <TouchableOpacity
          style={rowStyle}
          onPress={onPress}
          disabled={disabled}
        >
          {icon && <IconSvg icon={icon} size={20} state="default" />}
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      );
    }

    case "switch": {
      const { value, onValueChange } = options as SwitchOptions;
      return (
        <View style={rowStyle}>
          {icon && <IconSvg icon={icon} size={20} state="default" />}

          <Text style={styles.label}>{label}</Text>
          <Switch
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
          />
        </View>
      );
    }

    case "input": {
      const { value, placeholder, onChangeText } = options as InputOptions;
      return (
        <View style={rowStyle}>
          {icon && <IconSvg icon={icon} size={20} state="default" />}
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={value}
            placeholder={placeholder}
            onChangeText={onChangeText}
            editable={!disabled}
          />
        </View>
      );
    }

    case "dropdown": {
      const { options: items, selected, onSelect } = options as DropdownOptions;
      return (
        <TouchableOpacity
          style={rowStyle}
          onPress={() => {
            /* you’d show a modal or ActionSheet here */
          }}
          disabled={disabled}
        >
          {icon && <IconSvg icon={icon} size={20} state="default" />}
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{selected}</Text>
          <IconSvg icon="chevron-down" size={20} state="default" />
        </TouchableOpacity>
      );
    }

    case "date": {
      const { date, onChange } = options as DateOptions;
      return (
        <TouchableOpacity
          style={rowStyle}
          onPress={() => {
            /* open date picker and call onChange */
          }}
          disabled={disabled}
        >
          {icon && <IconSvg icon={icon} size={20} state="default" />}
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{date.toLocaleDateString()}</Text>
          <IconSvg icon="calendar-day" size={20} state="default" />
        </TouchableOpacity>
      );
    }

    default:
      return null;
  }
}

// 6) Styles
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  disabledRow: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  input: {
    borderBottomWidth: 1,
    flex: 1,
    textAlign: "right",
  },
  value: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
  },
});
