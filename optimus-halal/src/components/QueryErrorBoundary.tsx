/**
 * QueryErrorBoundary
 *
 * Error boundary integrated with QueryErrorResetBoundary from React Query.
 * Shows an error screen with a retry button that resets the React Query cache
 * and re-renders the component. Supports dark mode.
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Error Fallback (functional component — supports hooks / dark mode)
// ---------------------------------------------------------------------------

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: isDark ? "#0f1a13" : "#ffffff" }}
    >
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-6"
        style={{
          backgroundColor: isDark
            ? "rgba(239,68,68,0.1)"
            : "rgba(239,68,68,0.08)",
        }}
      >
        <MaterialIcons
          name="error-outline"
          size={36}
          color={isDark ? "#f87171" : "#ef4444"}
        />
      </View>
      <Text className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
        Erreur de chargement
      </Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
        Impossible de charger les données. Vérifiez votre connexion et
        réessayez.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Réessayer"
        className="bg-primary px-8 py-3 rounded-xl flex-row items-center gap-2"
      >
        <MaterialIcons name="refresh" size={20} color="#ffffff" />
        <Text className="font-bold text-sm text-white">Réessayer</Text>
      </TouchableOpacity>
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
