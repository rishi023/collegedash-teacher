import { Redirect } from 'expo-router';

export default function Index() {
  // Use Expo Router's Redirect component instead of useEffect + router.replace
  // This ensures the navigation happens at the right time in the component lifecycle
  return <Redirect href="/login" />;
}