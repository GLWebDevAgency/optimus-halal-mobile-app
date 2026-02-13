/**
 * Input Component
 * 
 * Composant input réutilisable avec support dark mode
 */

import React, { useState } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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
  className = "",
  secureTextEntry,
  ref,
  ...props
}: InputProps) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = secureTextEntry !== undefined;

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    return (
      <View className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            {label}
          </Text>
        )}
        
        <View className="relative">
          {leftIcon && (
            <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
              <MaterialIcons
                name={leftIcon}
                size={20}
                color="#94a3b8"
              />
            </View>
          )}

          <TextInput
            ref={ref}
            className={`
              w-full h-14 px-4
              ${leftIcon ? "pl-12" : ""}
              ${rightIcon || isPassword ? "pr-12" : ""}
              bg-white dark:bg-surface-dark
              border rounded-xl
              ${error 
                ? "border-danger" 
                : "border-slate-200 dark:border-slate-700 focus:border-primary-500"
              }
              text-slate-900 dark:text-white
              text-base
              ${className}
            `}
            placeholderTextColor="#94a3b8"
            secureTextEntry={isPassword ? !isPasswordVisible : false}
            {...props}
          />

          {(rightIcon || isPassword) && (
            <TouchableOpacity
              onPress={isPassword ? togglePasswordVisibility : onRightIconPress}
              className="absolute right-4 top-0 bottom-0 justify-center"
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
                color="#94a3b8"
              />
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <Text className="text-sm text-danger ml-1">{error}</Text>
        )}
        
        {hint && !error && (
          <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">
            {hint}
          </Text>
        )}
      </View>
    );
}

export default Input;
