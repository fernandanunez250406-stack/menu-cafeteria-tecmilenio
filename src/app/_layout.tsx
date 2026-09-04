import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {/* Stack handles the navigation between screens */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* We will route your tabs through an index file instead */}
        <Stack.Screen name="index" /> 
        <Stack.Screen name="menu" />
      </Stack>
    </ThemeProvider>
  );
}
