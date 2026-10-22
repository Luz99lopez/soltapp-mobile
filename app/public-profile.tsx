import { Stack } from 'expo-router';
import PublicProfileScreen from '@/src/screens/PublicProfileScreen';

export default function PublicProfileRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PublicProfileScreen />
    </>
  );
}
