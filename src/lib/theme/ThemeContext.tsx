'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'indigo' | 'blue' | 'green' | 'purple' | 'teal' | 'orange';

interface ThemeContextType {
  theme: ThemeMode;
  accent: AccentColor;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [accent, setAccentState] = useState<AccentColor>('indigo');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load from localStorage if present
    const savedTheme = (localStorage.getItem('tax_nexus_theme') as ThemeMode) || 'light';
    const savedAccent = (localStorage.getItem('tax_nexus_accent') as AccentColor) || 'indigo';
    setThemeState(savedTheme);
    setAccentState(savedAccent);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply Accent
    root.setAttribute('data-accent', accent);
    localStorage.setItem('tax_nexus_accent', accent);

    // Apply Theme Mode
    let isDark = false;
    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      root.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      root.classList.remove('dark');
      setResolvedTheme('light');
    }

    localStorage.setItem('tax_nexus_theme', theme);
  }, [theme, accent]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
  };

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
