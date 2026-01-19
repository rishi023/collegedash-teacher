import { useTheme } from '@/contexts/ThemeContext';

export function useColorScheme() {
  const { effectiveTheme } = useTheme();
  return effectiveTheme;
}
