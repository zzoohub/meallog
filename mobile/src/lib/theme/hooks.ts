import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@/styles/tokens';
import { useSettingsStore } from '@/domains/settings/stores/settingsStore';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { display } = useSettingsStore();
  
  // Determine the effective color scheme based on user preference
  const getEffectiveColorScheme = () => {
    switch (display.theme) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      case 'system':
      default:
        return systemColorScheme || 'light';
    }
  };
  
  const effectiveColorScheme = getEffectiveColorScheme();
  const theme = effectiveColorScheme === 'dark' ? darkTheme : lightTheme;
  
  return {
    theme,
    colorScheme: effectiveColorScheme,
    isDark: effectiveColorScheme === 'dark',
    isLight: effectiveColorScheme === 'light',
  };
}