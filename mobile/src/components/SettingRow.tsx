// mobile/src/components/SettingsRow.tsx
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { IconSvg } from "../icons/IconSvg";
import { IconName } from "../icons/icons";
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
  onSubmit: (t: string) => void;
}

interface DropdownOptions {
  items: { label: string; value: string }[];
  selected: string;
  onSelect: (item: string) => void;
}

interface DateOptions {
  date: Date;
  type?: "time" | "date"; // default is "date"
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

// --- Sub-components for each row type ---

function NavigationRow({
  label,
  icon,
  disabled,
  onPress,
  navigation,
  route,
  params,
}: {
  label: string;
  icon?: IconName;
  disabled: boolean;
} & NavigationOptions) {
  const rowStyle = [styles.row, disabled && styles.disabledRow];
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

function ButtonRow({
  label,
  icon,
  disabled,
  onPress,
}: {
  label: string;
  icon?: IconName;
  disabled: boolean;
} & ButtonOptions) {
  const rowStyle = [styles.row, disabled && styles.disabledRow];
  return (
    <TouchableOpacity style={rowStyle} onPress={onPress} disabled={disabled}>
      {icon && <IconSvg icon={icon} size={20} state="default" />}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

function SwitchRow({
  label,
  icon,
  disabled,
  value,
  onValueChange,
}: {
  label: string;
  icon?: IconName;
  disabled: boolean;
} & SwitchOptions) {
  const rowStyle = [styles.row, disabled && styles.disabledRow];
  const [valueState, setValueState] = useState(value);
  const onValueChangeHandler = (newValue: boolean) => {
    setValueState(newValue);
    onValueChange(newValue);
  };
  return (
    <View style={rowStyle}>
      {icon && <IconSvg icon={icon} size={20} state="default" />}
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={valueState}
        onValueChange={onValueChangeHandler}
        disabled={disabled}
      />
    </View>
  );
}

function InputRow({
  label,
  icon,
  disabled,
  value,
  placeholder,
  onSubmit,
}: {
  label: string;
  icon?: IconName;
  disabled: boolean;
} & InputOptions) {
  const rowStyle = [styles.row, disabled && styles.disabledRow];
  const [inputValue, setInputValue] = useState(value);
  const [editing, setEditing] = useState(false);
  const onSubmitHandler = () => {
    if (inputValue.trim() !== "") {
      onSubmit(inputValue);
      setEditing(false);
    }
  };
  return (
    <View style={rowStyle}>
      {icon && <IconSvg icon={icon} size={20} state="default" />}
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={inputValue}
        placeholder={placeholder}
        onChangeText={setInputValue}
        editable={!disabled && editing}
      />
      {!editing ? (
        <TouchableOpacity onPress={() => setEditing(true)} disabled={disabled}>
          <IconSvg icon="pencil" size={20} state="default" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onSubmitHandler} disabled={disabled}>
          <IconSvg icon="check-circle" size={20} state="default" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function DropdownRow({
  label,
  icon,
  disabled,
  items,
  selected,
  onSelect,
}: {
  label: string;
  icon?: IconName;
  disabled: boolean;
} & DropdownOptions) {
  const rowStyle = [styles.row, disabled && styles.disabledRow];
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selected);
  const [itemsList, setItemsList] = useState(items);
  return (
    <TouchableOpacity style={rowStyle} disabled={disabled}>
      {icon && <IconSvg icon={icon} size={20} state="default" />}
      <Text style={styles.label}>{label}</Text>
      <View style={{}}>
        <DropDownPicker
          open={open}
          value={value}
          items={itemsList}
          setOpen={setOpen}
          setValue={setValue}
          setItems={setItemsList}
          placeholder="Select an option"
          listMode="MODAL"
          style={{
            maxWidth: 200,
            minWidth: 100,
            backgroundColor: "#fff",
          }}
          onChangeValue={(item) => onSelect(item as string)}
          dropDownContainerStyle={{ backgroundColor: "#fff" }}
        />
      </View>
    </TouchableOpacity>
  );
}

function DateRow({
  label,
  icon,
  disabled,
  date,
  type = "date",
  onChange,
}: {
  label: string;
  icon?: IconName;
  disabled: boolean;
} & DateOptions) {
  const rowStyle = [styles.row, disabled && styles.disabledRow];
  const [value, setValue] = useState(date);
  const [tempValue, setTempValue] = useState(date);
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={rowStyle}
      onPress={() => {
        setOpen(true);
      }}
      disabled={disabled}
    >
      {icon && <IconSvg icon={icon} size={20} state="default" />}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {type == "date"
          ? value.toLocaleDateString()
          : value.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })}
      </Text>
      <IconSvg icon="calendar-day" size={20} state="default" />
      <DateTimePickerModal
        isVisible={open}
        mode={type}
        onConfirm={() => {
          setOpen(false);
          setValue(tempValue);
          onChange(tempValue);
        }}
        onCancel={() => {
          setOpen(false);
        }}
        onChange={(date: Date) => {
          setTempValue(date);
        }}
      />
    </TouchableOpacity>
  );
}

// 5) The component
export function SettingsRow<T extends RowType>({
  type,
  label,
  disabled = false,
  options,
  icon,
}: SettingsRowProps<T>) {
  switch (type) {
    case "navigation":
      return (
        <NavigationRow
          label={label}
          icon={icon}
          disabled={disabled}
          {...(options as NavigationOptions)}
        />
      );
    case "button":
      return (
        <ButtonRow
          label={label}
          icon={icon}
          disabled={disabled}
          {...(options as ButtonOptions)}
        />
      );
    case "switch":
      return (
        <SwitchRow
          label={label}
          icon={icon}
          disabled={disabled}
          {...(options as SwitchOptions)}
        />
      );
    case "input":
      return (
        <InputRow
          label={label}
          icon={icon}
          disabled={disabled}
          {...(options as InputOptions)}
        />
      );
    case "dropdown":
      return (
        <DropdownRow
          label={label}
          icon={icon}
          disabled={disabled}
          {...(options as DropdownOptions)}
        />
      );
    case "date":
      return (
        <DateRow
          label={label}
          icon={icon}
          disabled={disabled}
          {...(options as DateOptions)}
        />
      );
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
    //borderBottomWidth: 1,
    flex: 1,
    maxWidth: 150,
    //textAlign: "right",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginHorizontal: 8,
    color: "#333",
    backgroundColor: "#fff",
  },
  value: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
  },
});
