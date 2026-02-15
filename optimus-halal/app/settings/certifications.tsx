/**
 * Certifications Preferences Screen
 * Design fidèle au template HTML (Light/Dark mode)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Modal,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { usePreferencesStore } from "@/store";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";

// Types
interface Certification {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  colorDark: string;
  bgColor: string;
  bgColorDark: string;
  borderColor: string;
  borderColorDark: string;
  isRecommended?: boolean;
  details?: {
    fullName: string;
    location: string;
    slaughterMethod: string;
    stunning: string;
    control: string;
    website?: string;
  };
}

interface EthicalCriteria {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  colorDark: string;
  bgColor: string;
  bgColorDark: string;
  borderColor: string;
  borderColorDark: string;
}

// Données des certifications halal
const HALAL_CERTIFICATIONS: Certification[] = [
  {
    id: "avs",
    code: "AVS",
    name: "A Votre Service",
    description: "Contrôle strict, abattage manuel sans étourdissement, traçabilité indépendante.",
    color: "#13ec6a",
    colorDark: "#13ec6a",
    bgColor: "rgba(19, 236, 106, 0.1)",
    bgColorDark: "rgba(19, 236, 106, 0.1)",
    borderColor: "rgba(19, 236, 106, 0.2)",
    borderColorDark: "rgba(19, 236, 106, 0.2)",
    isRecommended: true,
    details: {
      fullName: "Association A Votre Service",
      location: "France (National)",
      slaughterMethod: "Abattage manuel uniquement",
      stunning: "Interdit - Sans étourdissement",
      control: "Contrôleurs présents en permanence",
      website: "https://www.avs.fr",
    },
  },
  {
    id: "achahada",
    code: "ACH",
    name: "Achahada",
    description: "Certification rigoureuse, présence de contrôleurs sur site, transparence totale.",
    color: "#3b82f6",
    colorDark: "#60a5fa",
    bgColor: "rgba(59, 130, 246, 0.1)",
    bgColorDark: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.2)",
    borderColorDark: "rgba(59, 130, 246, 0.2)",
    details: {
      fullName: "Achahada Certification",
      location: "France (National)",
      slaughterMethod: "Abattage manuel",
      stunning: "Interdit - Sans étourdissement",
      control: "Contrôle régulier sur site",
      website: "https://www.achahada.fr",
    },
  },
  {
    id: "argml",
    code: "ARG",
    name: "ARGML (Lyon)",
    description: "Mosquée de Lyon. Autorise l'étourdissement sous conditions, contrôle par échantillonnage.",
    color: "#6b7280",
    colorDark: "#9ca3af",
    bgColor: "rgba(107, 114, 128, 0.1)",
    bgColorDark: "rgba(107, 114, 128, 0.1)",
    borderColor: "rgba(107, 114, 128, 0.2)",
    borderColorDark: "rgba(107, 114, 128, 0.2)",
    details: {
      fullName: "Association Rituelle de la Grande Mosquée de Lyon",
      location: "Région Rhône-Alpes",
      slaughterMethod: "Abattage manuel et mécanique",
      stunning: "Autorisé sous conditions",
      control: "Contrôle par échantillonnage",
    },
  },
  {
    id: "sfcvh",
    code: "SFC",
    name: "SFCVH (Paris)",
    description: "Société Française de Contrôle de Viande Halal. Contrôle industriel standard.",
    color: "#6b7280",
    colorDark: "#9ca3af",
    bgColor: "rgba(107, 114, 128, 0.1)",
    bgColorDark: "rgba(107, 114, 128, 0.1)",
    borderColor: "rgba(107, 114, 128, 0.2)",
    borderColorDark: "rgba(107, 114, 128, 0.2)",
    details: {
      fullName: "Société Française de Contrôle de Viande Halal",
      location: "Île-de-France",
      slaughterMethod: "Abattage industriel",
      stunning: "Variable selon abattoir",
      control: "Contrôle périodique",
    },
  },
];

// Critères éthiques
const ETHICAL_CRITERIA: EthicalCriteria[] = [
  {
    id: "bio",
    name: "Agriculture Biologique",
    description: "Privilégier les produits certifiés AB ou Eurofeuille.",
    icon: "eco",
    color: "#16a34a",
    colorDark: "#4ade80",
    bgColor: "rgba(22, 163, 74, 0.1)",
    bgColorDark: "rgba(22, 163, 74, 0.2)",
    borderColor: "rgba(22, 163, 74, 0.2)",
    borderColorDark: "rgba(22, 163, 74, 0.3)",
  },
];

export default function CertificationsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { certifications, toggleCertification } = usePreferencesStore();
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const isCertEnabled = (id: string) => certifications.includes(id);

  const handleToggle = (id: string) => {
    toggleCertification(id);
  };

  const openDetails = (cert: Certification) => {
    setSelectedCert(cert);
    setShowDetails(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header Sticky */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
          backgroundColor: isDark ? "rgba(16, 34, 23, 0.95)" : "rgba(246, 248, 247, 0.95)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              height: 40,
              width: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : colors.card,
            }}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            accessibilityHint="Revenir à l'écran précédent"
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, flex: 1, textAlign: "center" }}
            accessibilityRole="header"
          >
            {t.certifications.title}
          </Text>
          <TouchableOpacity
            style={{
              height: 40,
              width: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : colors.card,
            }}
            accessibilityRole="button"
            accessibilityLabel="Aide"
            accessibilityHint="Afficher l'aide sur les certifications"
          >
            <MaterialIcons name="help-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Titre */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 24 }}
        >
          <Text
            style={{ fontSize: 24, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}
            accessibilityRole="header"
          >
            Vos Préférences
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
            {t.certifications.description}
          </Text>
        </Animated.View>

        {/* Liste des Certifications Halal */}
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {HALAL_CERTIFICATIONS.map((cert, index) => {
            const isEnabled = isCertEnabled(cert.id);
            const cardOpacity = isEnabled ? 1 : 0.8;

            return (
              <Animated.View
                key={cert.id}
                entering={FadeInDown.delay(150 + index * 50).duration(400)}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  opacity: cardOpacity,
                  borderWidth: 1,
                  borderColor: isEnabled 
                    ? isDark ? "rgba(19, 236, 106, 0.3)" : "rgba(19, 236, 106, 0.3)"
                    : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.05,
                  shadowRadius: 8,
                  elevation: isDark ? 0 : 2,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16 }}>
                  {/* Badge Code */}
                  <View
                    style={{
                      height: 48,
                      width: 48,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                      backgroundColor: isDark ? cert.bgColorDark : cert.bgColor,
                      borderWidth: 1,
                      borderColor: isDark ? cert.borderColorDark : cert.borderColor,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: isDark ? cert.colorDark : cert.color,
                      }}
                    >
                      {cert.code}
                    </Text>
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    {/* Title Row */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                        {cert.name}
                      </Text>
                      <Switch
                        value={isEnabled}
                        onValueChange={() => handleToggle(cert.id)}
                        trackColor={{
                          false: isDark ? "#374151" : "#d1d5db",
                          true: colors.primary
                        }}
                        thumbColor="#ffffff"
                        ios_backgroundColor={isDark ? "#374151" : "#d1d5db"}
                        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                        accessibilityRole="switch"
                        accessibilityLabel={`Activer ${cert.name}`}
                        accessibilityState={{ checked: isEnabled }}
                      />
                    </View>

                    {/* Description */}
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        lineHeight: 18,
                        marginBottom: 12,
                      }}
                    >
                      {cert.description}
                    </Text>

                    {/* Actions Row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      {cert.isRecommended && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: isDark ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.1)",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.2)",
                          }}
                        >
                          <MaterialIcons
                            name="verified"
                            size={12}
                            color={isDark ? "#4ade80" : "#16a34a"}
                          />
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "600",
                              color: isDark ? "#4ade80" : "#16a34a",
                            }}
                          >
                            Recommandé
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => openDetails(cert)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Détails de ${cert.name}`}
                        accessibilityHint="Afficher les détails de cette certification"
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: isEnabled ? colors.primary : colors.textSecondary,
                          }}
                        >
                          Détails
                        </Text>
                        <MaterialIcons
                          name="chevron-right"
                          size={14}
                          color={isEnabled ? colors.primary : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Section Critères Éthiques */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Animated.Text
            entering={FadeInDown.delay(400).duration(400)}
            style={{
              fontSize: 12,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
              color: colors.textSecondary,
              marginBottom: 12,
              paddingHorizontal: 4,
            }}
            accessibilityRole="header"
          >
            Critères Éthiques
          </Animated.Text>

          {ETHICAL_CRITERIA.map((criteria, index) => {
            const isEnabled = isCertEnabled(criteria.id);

            return (
              <Animated.View
                key={criteria.id}
                entering={FadeInDown.delay(450 + index * 50).duration(400)}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: isEnabled
                    ? isDark ? "rgba(19, 236, 106, 0.3)" : "rgba(19, 236, 106, 0.3)"
                    : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.05,
                  shadowRadius: 8,
                  elevation: isDark ? 0 : 2,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16 }}>
                  {/* Icon */}
                  <View
                    style={{
                      height: 48,
                      width: 48,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                      backgroundColor: isDark ? criteria.bgColorDark : criteria.bgColor,
                      borderWidth: 1,
                      borderColor: isDark ? criteria.borderColorDark : criteria.borderColor,
                    }}
                  >
                    <MaterialIcons
                      name={criteria.icon}
                      size={24}
                      color={isDark ? criteria.colorDark : criteria.color}
                    />
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                        {criteria.name}
                      </Text>
                      <Switch
                        value={isEnabled}
                        onValueChange={() => handleToggle(criteria.id)}
                        trackColor={{
                          false: isDark ? "#374151" : "#d1d5db",
                          true: colors.primary,
                        }}
                        thumbColor="#ffffff"
                        ios_backgroundColor={isDark ? "#374151" : "#d1d5db"}
                        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                        accessibilityRole="switch"
                        accessibilityLabel={`Activer ${criteria.name}`}
                        accessibilityState={{ checked: isEnabled }}
                      />
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                      {criteria.description}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Info Card */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(400)}
          style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 32 }}
        >
          <View
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 12,
              padding: 16,
              backgroundColor: isDark
                ? "rgba(31, 41, 55, 1)"
                : "rgba(243, 244, 246, 1)",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(209, 213, 219, 1)",
            }}
          >
            {/* Decorative blur */}
            <View
              style={{
                position: "absolute",
                right: -16,
                top: -16,
                height: 80,
                width: 80,
                borderRadius: 40,
                backgroundColor: "rgba(19, 236, 106, 0.1)",
              }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <MaterialIcons name="info" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Pourquoi choisir ?
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 18,
                  }}
                >
                  Choisir vos certifications permet d&apos;exclure automatiquement les produits qui ne correspondent pas à vos critères religieux ou éthiques lors du scan.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modal Détails */}
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetails(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          onPress={() => setShowDetails(false)}
          accessibilityRole="button"
          accessibilityLabel="Fermer les détails"
        >
          <Pressable
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: 40,
              maxHeight: "80%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View
              style={{
                alignSelf: "center",
                width: 40,
                height: 4,
                backgroundColor: colors.borderLight,
                borderRadius: 2,
                marginBottom: 16,
              }}
            />

            {selectedCert && (
              <ScrollView style={{ paddingHorizontal: 20 }}>
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 14,
                      backgroundColor: isDark ? selectedCert.bgColorDark : selectedCert.bgColor,
                      borderWidth: 1,
                      borderColor: isDark ? selectedCert.borderColorDark : selectedCert.borderColor,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        color: isDark ? selectedCert.colorDark : selectedCert.color,
                      }}
                    >
                      {selectedCert.code}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}
                      accessibilityRole="header"
                    >
                      {selectedCert.name}
                    </Text>
                    {selectedCert.isRecommended && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                        }}
                      >
                        <MaterialIcons name="verified" size={14} color={isDark ? "#4ade80" : "#16a34a"} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: isDark ? "#4ade80" : "#16a34a" }}>
                          Recommandé par Optimus Halal
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Description */}
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 24 }}>
                  {selectedCert.description}
                </Text>

                {/* Details List */}
                {selectedCert.details && (
                  <View style={{ gap: 16 }}>
                    <DetailRow
                      icon="business"
                      label="Nom complet"
                      value={selectedCert.details.fullName}
                      colors={colors}
                      isDark={isDark}
                    />
                    <DetailRow
                      icon="location-on"
                      label="Zone d'activité"
                      value={selectedCert.details.location}
                      colors={colors}
                      isDark={isDark}
                    />
                    <DetailRow
                      icon="content-cut"
                      label="Méthode d'abattage"
                      value={selectedCert.details.slaughterMethod}
                      colors={colors}
                      isDark={isDark}
                    />
                    <DetailRow
                      icon="flash-off"
                      label="Étourdissement"
                      value={selectedCert.details.stunning}
                      colors={colors}
                      isDark={isDark}
                      highlight={selectedCert.details.stunning.includes("Interdit")}
                    />
                    <DetailRow
                      icon="verified-user"
                      label="Type de contrôle"
                      value={selectedCert.details.control}
                      colors={colors}
                      isDark={isDark}
                    />
                  </View>
                )}

                {/* Toggle Button */}
                <TouchableOpacity
                  onPress={() => {
                    handleToggle(selectedCert.id);
                    setShowDetails(false);
                  }}
                  style={{
                    marginTop: 32,
                    backgroundColor: isCertEnabled(selectedCert.id) ? colors.buttonSecondary : colors.primary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={isCertEnabled(selectedCert.id) ? `Retirer ${selectedCert.name} des préférences` : `Ajouter ${selectedCert.name} aux préférences`}
                >
                  <MaterialIcons
                    name={isCertEnabled(selectedCert.id) ? "remove-circle-outline" : "add-circle-outline"}
                    size={20}
                    color={isCertEnabled(selectedCert.id) ? colors.textPrimary : (isDark ? "#102217" : "#0d1b13")}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: isCertEnabled(selectedCert.id) ? colors.textPrimary : (isDark ? "#102217" : "#0d1b13"),
                    }}
                  >
                    {isCertEnabled(selectedCert.id) ? "Retirer des préférences" : "Ajouter aux préférences"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// Composant pour les lignes de détails
interface DetailRowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
  highlight?: boolean;
}

function DetailRow({ icon, label, value, colors, isDark, highlight }: DetailRowProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <View
        style={{
          height: 36,
          width: 36,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          backgroundColor: highlight
            ? isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)"
            : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        }}
      >
        <MaterialIcons
          name={icon}
          size={18}
          color={highlight ? (isDark ? "#4ade80" : "#16a34a") : colors.textSecondary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>{label}</Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: highlight ? (isDark ? "#4ade80" : "#16a34a") : colors.textPrimary,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
