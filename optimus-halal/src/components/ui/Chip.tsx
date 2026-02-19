/**
 * Chip Component
 * 
 * Composant chip pour filtres et tags sélectionnables
 */

import React from "react";
import { TouchableOpacity, Text, View, TouchableOpacityProps } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics } from "@/hooks";
import { lightTheme, brand, neutral } from "@/theme/colors";

export interface ChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onClose?: () => void;
  variant?: "default" | "primary";
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  icon,
  onClose,
  variant = "default",
  onPress,
  className = "",
  ...props
}) => {
  const { impact } = useHaptics();
  const handlePress = async (e: any) => {
    impact();
    onPress?.(e);
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
    <TouchableOpacity
      onPress={handlePress}
      className={`${baseStyles} ${selectedStyles} ${className}`}
      {...props}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={16}
          color={selected ? (variant === "primary" ? lightTheme.textPrimary : brand.white) : neutral[600]}
        />
      )}
      <Text className={`text-sm ${textStyles}`}>{label}</Text>
      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
        >
          <MaterialIcons
            name="close"
            size={16}
            color={selected ? (variant === "primary" ? lightTheme.textPrimary : brand.white) : neutral[600]}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
