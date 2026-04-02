/**
 * QueryErrorBoundary
 *
 * Error boundary integrated with QueryErrorResetBoundary from React Query.
 * Shows an error screen with a retry button that resets the React Query cache
 * and re-renders the component.
 *
 * Uses useColorScheme (RN built-in) instead of useTheme (Zustand) to avoid
 * state subscriptions that fire before mount completes in class components.
 * All styles are native StyleSheet — no NativeWind/className to avoid
 * context loss inside the error boundary tree.
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { ArrowClockwiseIcon, WarningCircleIcon } from "phosphor-react-native";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { semantic, darkTheme, lightTheme, brand } from "@/theme/colors";
import { PressableScale } from "./ui/PressableScale";

// ---------------------------------------------------------------------------
// Error Fallback — pure native styles, no NativeWind, no Zustand
// ---------------------------------------------------------------------------

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const isDark = useColorScheme() === "dark";

  const bg = isDark ? darkTheme.background : lightTheme.backgroundSecondary;
  const textPrimary = isDark ? darkTheme.textPrimary : lightTheme.textPrimary;
  const textSecondary = isDark ? darkTheme.textSecondary : lightTheme.textSecondary;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isDark
              ? "rgba(239,68,68,0.10)"
              : "rgba(239,68,68,0.08)",
          },
        ]}
      >
        <WarningCircleIcon size={36} color={semantic.danger.base} />
      </View>
      <Text style={[styles.title, { color: textPrimary }]}>
        Une erreur est survenue
      </Text>
      <Text style={[styles.subtitle, { color: textSecondary }]}>
        Impossible de charger le contenu. Vérifiez votre connexion.
      </Text>
      <PressableScale
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Réessayer"
      >
        <View style={styles.retryButton}>
          <ArrowClockwiseIcon size={20} color="#ffffff" />
          <Text style={styles.retryText}>Réessayer</Text>
        </View>
      </PressableScale>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Inner class-based error boundary
// ---------------------------------------------------------------------------

interface InnerProps {
  children: ReactNode;
  onReset: () => void;
}

interface InnerState {
  hasError: boolean;
}

class QueryErrorBoundaryInner extends Component<InnerProps, InnerState> {
  state: InnerState = { hasError: false };

  static getDerivedStateFromError(_error: Error): InnerState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[QueryErrorBoundary]", error.message, info.componentStack);
  }

  private handleRetry = () => {
    this.props.onReset();
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Public wrapper
// ---------------------------------------------------------------------------

export interface QueryErrorBoundaryProps {
  children: ReactNode;
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({
  children,
}) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <QueryErrorBoundaryInner onReset={reset}>
        {children}
      </QueryErrorBoundaryInner>
    )}
  </QueryErrorResetBoundary>
);

export default QueryErrorBoundary;

// ---------------------------------------------------------------------------
// Styles — native only, no NativeWind dependency
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: brand.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
