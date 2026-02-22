/**
 * Auth Layout
 *
 * Gère toutes les routes d'authentification:
 * - welcome: Point d'entrée avec choix Magic Link / Classique
 * - magic-link: Connexion passwordless par email
 * - login: Connexion classique (email/password)
 * - signup: Inscription classique
 * - forgot-password: Demande de réinitialisation
 * - reset-confirmation: Confirmation d'envoi d'email
 * - set-new-password: Définir nouveau mot de passe
 */

import { Stack } from "expo-router";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { useTheme } from "@/hooks/useTheme";

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <QueryErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          animationDuration: 300,
          gestureEnabled: true,
          gestureDirection: "horizontal",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="welcome" options={{ animation: "fade" }} />
        <Stack.Screen name="magic-link" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen
          name="reset-confirmation"
          options={{
            animation: "fade",
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="set-new-password"
          options={{
            animation: "fade",
            animationDuration: 250,
          }}
        />
      </Stack>
    </QueryErrorBoundary>
  );
}
