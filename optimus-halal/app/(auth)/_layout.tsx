/**
 * Auth Layout
 * 
 * Gère toutes les routes d'authentification:
 * - login: Connexion
 * - signup: Inscription
 * - forgot-password: Demande de réinitialisation
 * - reset-confirmation: Confirmation d'envoi d'email
 * - set-new-password: Définir nouveau mot de passe
 */

import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-confirmation" />
      <Stack.Screen 
        name="set-new-password" 
        options={{
          animation: "fade",
        }}
      />
    </Stack>
  );
}
