import { Redirect } from 'expo-router';

export default function InitialScreen() {
  // Redirect to onboarding by default - let the routing logic handle auth state
  return <Redirect href="/onboarding" />;
}