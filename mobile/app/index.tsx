import { Redirect } from 'expo-router';

export default function InitialScreen() {
  // Redirect directly to main app - auth routing logic is handled in the main app
  return <Redirect href="/(main)" />;
}