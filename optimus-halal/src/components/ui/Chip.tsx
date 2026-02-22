/**
 * Chip Component
 * 
 * Composant chip pour filtres et tags sélectionnables
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics } from "@/hooks";
import { lightTheme, brand, neutral } from "@/theme/colors";
import { PressableScale } from "./PressableScale";

export interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onClose?: () => void;
  variant?: "default" | "primary";
  onPress?: () => void;
  className?: string;
  testID?: string;
  disabled?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  icon,
  onClose,
  variant = "default",
  onPress,
  className = "",
  testID,
  disabled,
}) => {
  const { impact } = useHaptics();
  const handlePress = () => {
    impact();
    onPress?.();
  };

  const baseStyles = `
    flex-row items-center gap-1.5
    h-9 px-4 rounded-full
    border
  `;

  const selectedStyles = selected
    ? variant === "primary"
      ? "bg-primary-500 border-primary-500"
      : "bg-slate-900 dark:bg-white border-slate-900 dark:border-white"
    : "bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700";

  const textStyles = selected
    ? variant === "primary"
      ? "text-slate-900 font-semibold"
      : "text-white dark:text-slate-900 font-semibold"
    : "text-slate-600 dark:text-slate-300 font-medium";

  return (
    <PressableScale
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
    >
      <View className={`${baseStyles} ${selectedStyles} ${className}`}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={16}
            color={selected ? (variant === "primary" ? lightTheme.textPrimary : brand.white) : neutral[600]}
          />
        )}
        <Text className={`text-sm ${textStyles}`}>{label}</Text>
        {onClose && (
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          >
            <MaterialIcons
              name="close"
              size={16}
              color={selected ? (variant === "primary" ? lightTheme.textPrimary : brand.white) : neutral[600]}
            />
          </Pressable>
        )}
      </View>
    </PressableScale>
  );
};

/**
 * Chip Group Component
 */
export interface ChipGroupProps {
  chips: { id: string; label: string; icon?: keyof typeof MaterialIcons.glyphMap }[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  multiSelect?: boolean;
  scrollable?: boolean;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({
  chips,
  selectedIds,
  onSelectionChange,
  multiSelect = false,
}) => {
  const handleChipPress = (chipId: string) => {
    if (multiSelect) {
      if (selectedIds.includes(chipId)) {
        onSelectionChange(selectedIds.filter((id) => id !== chipId));
      } else {
        onSelectionChange([...selectedIds, chipId]);
      }
    } else {
      onSelectionChange([chipId]);
    }
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          label={chip.label}
          icon={chip.icon}
          selected={selectedIds.includes(chip.id)}
          onPress={() => handleChipPress(chip.id)}
        />
      ))}
    </View>
  );
};

export default Chip;
