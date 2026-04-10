/**
 * SubstanceDetailSheet — Bottom sheet for substance drill-down.
 *
 * Opened when tapping a SubstanceSignalRow (premium only).
 * Contains tabs: Resume | 4 Madhabs | Fatwas | Sources
 *
 * @module components/scan-v2/SubstanceDetailSheet
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTheme } from "@/hooks/useTheme";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { halalStatus, gold } from "@/theme/colors";
import { X, Bug, Wine, PawPrint, Flask, Gear, Question, ArrowSquareOut } from "phosphor-react-native";
import type {
  SubstanceDetail,
  SubstanceIcon,
  MadhabRuling,
  FatwaEntry,
  ScholarlySource,
} from "./scan-v2-types";
import {
  getVerdictColor,
  scoreToVerdictLevel,
  getVerdictLabel,
  getFatwaVerdictColor,
} from "./scan-v2-utils";

const ICON_MAP: Record<SubstanceIcon, React.FC<any>> = {
  insect: Bug,
  alcohol: Wine,
  animal: PawPrint,
  enzyme: Flask,
  process: Gear,
  source: Question,
  other: Question,
};

type Tab = "resume" | "madhabs" | "fatwas" | "sources";

const TABS: { key: Tab; label: string }[] = [
  { key: "resume", label: "Resume" },
  { key: "madhabs", label: "4 Madhabs" },
  { key: "fatwas", label: "Fatwas" },
  { key: "sources", label: "Sources" },
];

interface SubstanceDetailSheetProps {
  substance: SubstanceDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SubstanceDetailSheet: React.FC<SubstanceDetailSheetProps> = ({
  substance,
  isOpen,
  onClose,
}) => {
  const { isDark, colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeTab, setActiveTab] = useState<Tab>("resume");
  const snapPoints = useMemo(() => ["70%", "90%"], []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  if (!substance) return null;

  const level = scoreToVerdictLevel(substance.score);
  const accentColor = getVerdictColor(level);
  const IconComponent = ICON_MAP[substance.icon] || Question;

  const renderTabContent = () => {
    switch (activeTab) {
      case "resume":
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.rationaleText, { color: colors.textPrimary }]}>
              {substance.rationaleFr}
            </Text>
            {substance.rationaleAr && (
              <Text
                style={[styles.rationaleAr, { color: colors.textSecondary }]}
              >
                {substance.rationaleAr}
              </Text>
            )}
            <View
              style={[
                styles.scenarioBox,
                { backgroundColor: isDark ? colors.backgroundSecondary : colors.background },
              ]}
            >
              <Text style={[styles.scenarioLabel, { color: colors.textMuted }]}>
                SCENARIO APPLIQUE
              </Text>
              <Text style={[styles.scenarioValue, { color: colors.textPrimary }]}>
                {substance.scenarioKey}
              </Text>
            </View>
          </View>
        );

      case "madhabs":
        return (
          <View style={styles.tabContent}>
            {substance.madhabRulings.map((ruling) => (
              <MadhabRulingRow key={ruling.madhab} ruling={ruling} colors={colors} isDark={isDark} />
            ))}
          </View>
        );

      case "fatwas":
        return (
          <View style={styles.tabContent}>
            {substance.fatwas.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Aucune fatwa repertoriee pour cette substance.
              </Text>
            ) : (
              substance.fatwas.map((fatwa, index) => (
                <FatwaRow key={`${fatwa.institution}-${index}`} fatwa={fatwa} colors={colors} isDark={isDark} />
              ))
            )}
          </View>
        );

      case "sources":
        return (
          <View style={styles.tabContent}>
            {substance.sources.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Aucune source scholarly disponible.
              </Text>
            ) : (
              substance.sources.map((source, index) => (
                <SourceRow key={`${source.title}-${index}`} source={source} colors={colors} />
              ))
            )}
          </View>
        );
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: isDark ? colors.card : colors.card,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.textMuted,
        width: 40,
      }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={[styles.substanceIcon, { backgroundColor: `${accentColor}15` }]}>
            <IconComponent size={24} color={accentColor} weight="fill" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.substanceName, { color: colors.textPrimary }]}>
              {substance.displayName}
            </Text>
            <View style={styles.headerMeta}>
              <Text style={[styles.scoreText, { color: accentColor }]}>
                Score {substance.score}
              </Text>
              <Text style={[styles.verdictText, { color: accentColor }]}>
                {getVerdictLabel(level)}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <X size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabItem,
                activeTab === tab.key && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                },
              ]}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.key }}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === tab.key
                        ? colors.primary
                        : colors.textSecondary,
                  },
                  activeTab === tab.key && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

// ── Sub-components ──

const MadhabRulingRow: React.FC<{
  ruling: MadhabRuling;
  colors: any;
  isDark: boolean;
}> = ({ ruling, colors, isDark }) => {
  const level = scoreToVerdictLevel(
    ruling.ruling === "halal" ? 95 :
    ruling.ruling === "halal_with_caution" ? 75 :
    ruling.ruling === "mashbooh" ? 55 :
    ruling.ruling === "avoid" ? 30 : 10
  );
  const accentColor = getVerdictColor(level);
  const madhabLabel = ruling.madhab.charAt(0).toUpperCase() + ruling.madhab.slice(1);

  return (
    <View
      style={[
        styles.rulingRow,
        { backgroundColor: isDark ? colors.backgroundSecondary : colors.background },
      ]}
    >
      <View style={styles.rulingHeader}>
        <Text style={[styles.rulingMadhab, { color: colors.textPrimary }]}>
          {madhabLabel}
        </Text>
        <View style={[styles.rulingBadge, { backgroundColor: `${accentColor}20` }]}>
          <Text style={[styles.rulingBadgeText, { color: accentColor }]}>
            {getVerdictLabel(level)}
          </Text>
        </View>
      </View>
      {ruling.isSplit && (
        <Text style={[styles.splitNote, { color: colors.textMuted }]}>
          Avis divise au sein de cette ecole
        </Text>
      )}
      {ruling.note && (
        <Text style={[styles.rulingNote, { color: colors.textSecondary }]}>
          {ruling.note}
        </Text>
      )}
    </View>
  );
};

const FatwaRow: React.FC<{
  fatwa: FatwaEntry;
  colors: any;
  isDark: boolean;
}> = ({ fatwa, colors, isDark }) => {
  const verdictColor = getFatwaVerdictColor(fatwa.verdict);
  const verdictLabels = { permis: "Permis", conditionnel: "Conditionnel", interdit: "Interdit" };

  return (
    <View
      style={[
        styles.fatwaRow,
        { backgroundColor: isDark ? colors.backgroundSecondary : colors.background },
      ]}
    >
      <View style={styles.fatwaHeader}>
        <Text style={[styles.fatwaInstitution, { color: colors.textPrimary }]}>
          {fatwa.institution}
        </Text>
        <View style={[styles.fatwaBadge, { backgroundColor: `${verdictColor}20` }]}>
          <Text style={[styles.fatwaBadgeText, { color: verdictColor }]}>
            {verdictLabels[fatwa.verdict]}
          </Text>
        </View>
      </View>
      {fatwa.year && (
        <Text style={[styles.fatwaYear, { color: colors.textMuted }]}>
          {fatwa.year}
        </Text>
      )}
    </View>
  );
};

const SourceRow: React.FC<{
  source: ScholarlySource;
  colors: any;
}> = ({ source, colors }) => {
  const handlePress = () => {
    if (source.url) Linking.openURL(source.url);
  };

  return (
    <Pressable
      onPress={source.url ? handlePress : undefined}
      style={styles.sourceRow}
      accessibilityRole={source.url ? "link" : "text"}
    >
      <View style={styles.sourceContent}>
        <Text style={[styles.sourceTitle, { color: colors.textPrimary }]}>
          {source.title}
        </Text>
        {source.author && (
          <Text style={[styles.sourceAuthor, { color: colors.textSecondary }]}>
            {source.author}
            {source.year ? ` (${source.year})` : ""}
          </Text>
        )}
      </View>
      {source.url && (
        <ArrowSquareOut size={16} color={colors.primary} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: spacing["3xl"],
    paddingBottom: spacing["6xl"],
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  substanceIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  substanceName: {
    fontFamily: headingFontFamily.bold,
    fontSize: 18,
    fontWeight: "700",
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  scoreText: {
    fontFamily: headingFontFamily.bold,
    fontSize: 14,
    fontWeight: "700",
  },
  verdictText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: "row",
    gap: spacing["3xl"],
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.15)",
    marginBottom: spacing.xl,
  },
  tabItem: {
    paddingBottom: spacing.md,
  },
  tabLabel: {
    fontFamily: bodyFontFamily.semiBold,
    fontSize: 13,
    fontWeight: "600",
  },
  tabLabelActive: {
    fontFamily: bodyFontFamily.bold,
    fontWeight: "700",
  },
  tabContent: {
    gap: spacing.xl,
  },
  rationaleText: {
    fontFamily: bodyFontFamily.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  rationaleAr: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 16,
    lineHeight: 28,
    textAlign: "right",
    writingDirection: "rtl",
  },
  scenarioBox: {
    padding: spacing.xl,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  scenarioLabel: {
    ...textStyles.micro,
  },
  scenarioValue: {
    fontFamily: bodyFontFamily.semiBold,
    fontSize: 13,
    fontWeight: "600",
  },
  rulingRow: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  rulingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rulingMadhab: {
    fontFamily: headingFontFamily.semiBold,
    fontSize: 15,
    fontWeight: "600",
  },
  rulingBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  rulingBadgeText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 11,
    fontWeight: "700",
  },
  splitNote: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 11,
    fontStyle: "italic",
  },
  rulingNote: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  fatwaRow: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  fatwaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fatwaInstitution: {
    fontFamily: bodyFontFamily.semiBold,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.md,
  },
  fatwaBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  fatwaBadgeText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 11,
    fontWeight: "700",
  },
  fatwaYear: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 11,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  sourceContent: {
    flex: 1,
    gap: spacing.xs,
  },
  sourceTitle: {
    fontFamily: bodyFontFamily.semiBold,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  sourceAuthor: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 11,
  },
  emptyText: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: spacing["3xl"],
  },
});

export default SubstanceDetailSheet;
