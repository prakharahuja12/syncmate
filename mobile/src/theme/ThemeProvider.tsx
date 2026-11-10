import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ColorTheme, LIGHT_THEME, DARK_THEME } from './tokens';
import { useUiStore } from '../stores/uiStore';

interface ThemeContextValue {
  theme: ColorTheme;
  themePreference: 'light' | 'dark' | 'system';
  setThemePreference: (pref: 'light' | 'dark' | 'system') => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DARK_THEME,
  themePreference: 'system',
  setThemePreference: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const themePreference = useUiStore((s) => s.themePreference);
  const setThemePreference = useUiStore((s) => s.setThemePreference);

  const isDark = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'light' ? false : true; // default dark if undefined
    }
    return themePreference === 'dark';
  }, [themePreference, systemColorScheme]);

  const theme = useMemo(() => (isDark ? DARK_THEME : LIGHT_THEME), [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, themePreference, setThemePreference, isDark }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

