/**
 * QueryErrorBoundary
 *
 * Error boundary integrated with QueryErrorResetBoundary from React Query.
 * Shows an error screen with a retry button that resets the React Query cache
 * and re-renders the component. Supports dark mode.
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useTheme, useTranslation } from "@/hooks";
import { semantic, darkTheme, lightTheme } from "@/theme/colors";

// ---------------------------------------------------------------------------
// Error Fallback (functional component — supports hooks / dark mode)
// ---------------------------------------------------------------------------

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: isDark ? darkTheme.background : lightTheme.backgroundSecondary }}
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
          color={semantic.danger.base}
        />
      </View>
      <Text className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
        {t.common.loadingError}
      </Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
        {t.common.loadingErrorDesc}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t.common.retry}
        className="bg-primary px-8 py-3 rounded-xl flex-row items-center gap-2"
      >
        <MaterialIcons name="refresh" size={20} color={lightTheme.textInverse} />
        <Text className="font-bold text-sm text-white">{t.common.retry}</Text>
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
