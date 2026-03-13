/**
 * Phone Input Component
 * 
 * Composant input pour numéro de téléphone avec:
 * - Indicatif pays (+33 France par défaut)
 * - Formatage automatique
 * - Validation du format français
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
} from "react-native";
import { CaretDownIcon, CheckIcon, XIcon } from "phosphor-react-native";
import { useTheme } from "@/hooks";
import { neutral, brand, darkTheme, lightTheme } from "@/theme/colors";
import { PressableScale } from "./PressableScale";

export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "BE", name: "Belgique", dialCode: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", dialCode: "+41", flag: "🇨🇭" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "MA", name: "Maroc", dialCode: "+212", flag: "🇲🇦" },
  { code: "DZ", name: "Algérie", dialCode: "+213", flag: "🇩🇿" },
  { code: "TN", name: "Tunisie", dialCode: "+216", flag: "🇹🇳" },
  { code: "SN", name: "Sénégal", dialCode: "+221", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮" },
  { code: "ML", name: "Mali", dialCode: "+223", flag: "🇲🇱" },
  { code: "TR", name: "Turquie", dialCode: "+90", flag: "🇹🇷" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Allemagne", dialCode: "+49", flag: "🇩🇪" },
  { code: "ES", name: "Espagne", dialCode: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Italie", dialCode: "+39", flag: "🇮🇹" },
];

export interface PhoneInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  label?: string;
  value?: string;
  onChangeText?: (phoneNumber: string, fullNumber: string) => void;
  error?: string;
  hint?: string;
  defaultCountryCode?: string;
  containerClassName?: string;
  ref?: React.Ref<TextInput>;
}

/**
 * Formate un numéro de téléphone français
 * Ex: 0612345678 -> 06 12 34 56 78
 */
function formatPhoneNumber(value: string, countryCode: string): string {
  // Retirer tous les caractères non numériques
  const cleaned = value.replace(/\D/g, "");
  
  if (countryCode === "FR") {
    // Format français: 06 12 34 56 78
    // On garde le 0 initial s'il est tapé par l'utilisateur
    const hasLeadingZero = value.startsWith("0");
    const digits = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
    
    if (digits.length === 0) return hasLeadingZero ? "0" : "";

    let formatted = "";
    // Si on a un 0 au début, on l'ajoute
    if (hasLeadingZero) formatted += "0";

    // Formatage par paires: XIcon XX XX XX XX
    if (digits.length <= 1) formatted += digits;
    else if (digits.length <= 3) formatted += `${digits.slice(0, 1)} ${digits.slice(1)}`;
    else if (digits.length <= 5) formatted += `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
    else if (digits.length <= 7) formatted += `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
    else formatted += `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;

    return formatted;
  }
  
  // Format générique: groupes de 2-3 chiffres
  const groups: string[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    groups.push(cleaned.slice(i, i + 2));
  }
  return groups.join(" ");
}

/**
 * Valide un numéro de téléphone français
 */
export function validateFrenchPhone(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "");
  // Numéro français: 9 chiffres après le 0 (ou sans le 0)
  // Ex: 0612345678 (10 chiffres) ou 612345678 (9 chiffres)
  return cleaned.length === 9 || cleaned.length === 10;
}

/**
 * Retourne le numéro complet avec l'indicatif
 */
export function getFullPhoneNumber(
  phoneNumber: string,
  dialCode: string
): string {
  const cleaned = phoneNumber.replace(/\D/g, "");
  // Retirer le 0 initial si présent
  const digits = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
  return `${dialCode}${digits}`;
}

/**
 * Parse un numéro international (+33612345678) en format local formaté
 * Retourne { localFormatted, fullNumber, countryCode }
 */
export function parseInternationalPhone(
  phone: string,
  defaultCountryCode = "FR"
): { localFormatted: string; fullNumber: string; countryCode: string } {
  if (!phone) return { localFormatted: "", fullNumber: "", countryCode: defaultCountryCode };

  // Trouver l'indicatif pays (trier par longueur décroissante pour matcher +213 avant +2)
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  const country = sorted.find((c) => phone.startsWith(c.dialCode));

  if (country) {
    const localDigits = phone.slice(country.dialCode.length);
    // Pour la France, préfixer avec 0
    const localNumber = country.code === "FR" ? `0${localDigits}` : localDigits;
    return {
      localFormatted: formatPhoneNumber(localNumber, country.code),
      fullNumber: phone,
      countryCode: country.code,
    };
  }

  // Pas de match — retourner tel quel
  return { localFormatted: phone, fullNumber: phone, countryCode: defaultCountryCode };
}

export function PhoneInput({
  label,
  value = "",
  onChangeText,
  error,
  hint,
  defaultCountryCode = "FR",
  containerClassName = "",
  ref,
  ...props
}: PhoneInputProps) {
    const { isDark } = useTheme();
    
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
      COUNTRY_CODES.find((c) => c.code === defaultCountryCode) || COUNTRY_CODES[0]
    );
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [localValue, setLocalValue] = useState(value);

    const handleChangeText = useCallback(
      (text: string) => {
        const formatted = formatPhoneNumber(text, selectedCountry.code);
        setLocalValue(formatted);
        
        const fullNumber = getFullPhoneNumber(text, selectedCountry.dialCode);
        onChangeText?.(formatted, fullNumber);
      },
      [selectedCountry, onChangeText]
    );

    const handleCountrySelect = useCallback(
      (country: CountryCode) => {
        setSelectedCountry(country);
        setIsPickerVisible(false);
        
        // Reformater avec le nouveau pays
        if (localValue) {
          const fullNumber = getFullPhoneNumber(localValue, country.dialCode);
          onChangeText?.(localValue, fullNumber);
        }
      },
      [localValue, onChangeText]
    );

    const isValid = useMemo(() => {
      if (!localValue) return true;
      if (selectedCountry.code === "FR") {
        return validateFrenchPhone(localValue);
      }
      // Pour les autres pays, vérifier une longueur minimale
      const cleaned = localValue.replace(/\D/g, "");
      return cleaned.length >= 6;
    }, [localValue, selectedCountry.code]);

    return (
      <View className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            {label}
          </Text>
        )}

        <View className="flex-row relative">
          {/* Country Code Selector */}
          <PressableScale
            onPress={() => setIsPickerVisible(true)}
          >
            <View
              className={`
                h-14 px-3 flex-row items-center justify-center
                bg-slate-100 dark:bg-surface-dark
                border rounded-l-xl
                ${error ? "border-danger" : "border-slate-200 dark:border-slate-700"}
              `}
            >
              <Text className="text-lg mr-1">{selectedCountry.flag}</Text>
              <Text className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                {selectedCountry.dialCode}
              </Text>
              <CaretDownIcon size={20}
                color={isDark ? neutral[400] : neutral[600]} />
            </View>
          </PressableScale>

          {/* Phone Input */}
          <TextInput
            ref={ref}
            className={`
              flex-1 h-14 px-4
              bg-white dark:bg-surface-dark
              border border-l-0 rounded-r-xl
              ${error
                ? "border-danger"
                : !isValid
                  ? "border-warning"
                  : "border-slate-200 dark:border-slate-700 focus:border-primary-500"
              }
              text-slate-900 dark:text-white
              text-base
            `}
            placeholder="6 12 34 56 78"
            placeholderTextColor={neutral[400]}
            keyboardType="phone-pad"
            value={localValue}
            onChangeText={handleChangeText}
            maxLength={15} // "06 12 34 56 78"
            {...props}
          />
        </View>

        {error && (
          <Text className="text-sm text-danger ml-1">{error}</Text>
        )}

        {!error && !isValid && localValue && (
          <Text className="text-sm text-warning ml-1">
            Format de numéro invalide
          </Text>
        )}

        {hint && !error && isValid && (
          <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">
            {hint}
          </Text>
        )}

        {/* Country Picker Modal */}
        <Modal
          visible={isPickerVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsPickerVisible(false)}
        >
          <View className={`flex-1 ${isDark ? "bg-background-dark" : "bg-white"}`}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                Sélectionner un pays
              </Text>
              <Pressable
                onPress={() => setIsPickerVisible(false)}
                className="p-2"
              >
                <XIcon size={24}
                  color={isDark ? darkTheme.textPrimary : lightTheme.textPrimary} />
              </Pressable>
            </View>

            {/* Country List */}
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <PressableScale
                  onPress={() => handleCountrySelect(item)}
                >
                  <View
                    className={`
                      flex-row items-center p-4 border-b border-slate-100 dark:border-slate-800
                      ${selectedCountry.code === item.code ? "bg-primary-50 dark:bg-primary-900/20" : ""}
                    `}
                  >
                    <Text className="text-2xl mr-3">{item.flag}</Text>
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white font-medium">
                        {item.name}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-sm">
                        {item.dialCode}
                      </Text>
                    </View>
                    {selectedCountry.code === item.code && (
                      <CheckIcon size={24} color={brand.primary} />
                    )}
                  </View>
                </PressableScale>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </Modal>
      </View>
    );
}

export default PhoneInput;
