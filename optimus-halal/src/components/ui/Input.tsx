/**
 * Input Component — Premium Naqiy Edition
 *
 * Gold-tinted borders at rest, green glow on focus (like the leaf
 * on the Naqiy "N" — the brand comes alive when you interact).
 */

import React, { useState, useCallback } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Text,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { PressableScale } from "./PressableScale";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
  ref?: React.Ref<TextInput>;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerClassName = "",
  secureTextEntry,
  ref,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...props
}: InputProps) {
  const { isDark, colors } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPassword = secureTextEntry !== undefined;

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((v) => !v);
  }, []);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocusProp?.(e);
  }, [onFocusProp]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlurProp?.(e);
  }, [onBlurProp]);

  // Border color: error > focus (green leaf) > gold rest
  const borderColor = error
    ? "#ef4444"
    : isFocused
      ? isDark ? "rgba(19,236,106,0.5)" : "rgba(9,154,68,0.5)"
      : isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.2)";

  const iconColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

  return (
    <View style={{ gap: 8 }} className={containerClassName}>
      {label && (
        <Text style={{
          fontSize: 13, fontWeight: "600", marginLeft: 4,
          color: colors.textPrimary,
        }}>
          {label}
        </Text>
      )}

      <View style={{ position: "relative" }}>
        {leftIcon && (
          <View style={{
            position: "absolute", left: 16, top: 0, bottom: 0,
            justifyContent: "center", zIndex: 10,
          }}>
            <MaterialIcons name={leftIcon} size={20} color={iconColor} />
          </View>
        )}

        <TextInput
          ref={ref}
          style={{
            width: "100%",
            height: 56,
            paddingHorizontal: 16,
            paddingLeft: leftIcon ? 48 : 16,
            paddingRight: (rightIcon || isPassword) ? 48 : 16,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
            borderWidth: 1,
            borderRadius: 12,
            borderColor,
            color: colors.textPrimary,
            fontSize: 16,
          }}
          placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"}
          secureTextEntry={isPassword ? !isPasswordVisible : false}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {(rightIcon || isPassword) && (
          <PressableScale
            onPress={isPassword ? togglePasswordVisibility : onRightIconPress}
            style={{
              position: "absolute", right: 16, top: 0, bottom: 0,
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={isPassword ? "Toggle password visibility" : undefined}
          >
            <MaterialIcons
              name={
                isPassword
                  ? isPasswordVisible
                    ? "visibility-off"
                    : "visibility"
                  : rightIcon!
              }
              size={20}
              color={iconColor}
            />
          </PressableScale>
        )}
      </View>

      {error && (
        <Text style={{ fontSize: 13, color: "#ef4444", marginLeft: 4 }}>{error}</Text>
      )}

      {hint && !error && (
        <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

export default Input;
