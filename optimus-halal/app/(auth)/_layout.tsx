/**
 * Auth Layout — Naqiy 2-Tier Model
 *
 * Routes d'authentification pour le modèle Guest / Naqiy+ :
 * - login: Connexion Naqiy+ (email/password + biométrie)
 * - magic-link: Connexion passwordless (magic link email)
 * - signup: Création de compte post-paiement RevenueCat
 * - forgot-password: Demande de réinitialisation
 * - reset-code: Saisie du code OTP (6 hex, 15min TTL)
 * - set-new-password: Définir nouveau mot de passe
 * - password-changed: Confirmation succès
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
        <Stack.Screen name="login" options={{ animation: "fade" }} />
        <Stack.Screen name="magic-link" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen
          name="set-new-password"
          options={{
            animation: "fade",
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="reset-code"
          options={{
            animation: "fade_from_bottom",
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="password-changed"
          options={{
            animation: "fade",
            animationDuration: 300,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </QueryErrorBoundary>
  );
}
