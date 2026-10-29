import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type TextScale = 'sm' | 'base' | 'lg';
export type BgDim = 'normal' | 'soft' | 'deep';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  textScale: TextScale;
  increaseTextSize: () => void;
  decreaseTextSize: () => void;
  resetTextSize: () => void;
  setTextScale: (scale: TextScale) => void;
  bgDim: BgDim;
  toggleBgDim: () => void;
  setBgDim: (dim: BgDim) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uba_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    }
    return 'dark';
  });

  const [textScale, setTextScaleState] = useState<TextScale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uba_font_scale');
      if (saved === 'sm' || saved === 'base' || saved === 'lg') return saved;
    }
    return 'base';
  });

  const [bgDim, setBgDimState] = useState<BgDim>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uba_bg_dim');
      if (saved === 'normal' || saved === 'soft' || saved === 'deep') return saved;
    }
    return 'normal';
  });

  const applyTheme = (t: Theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', t);
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', t === 'light' ? '#F6F8FA' : '#000000');
      }
    }
  };

  const applyTextScale = (s: TextScale) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-font-size', s);
    }
  };

  const applyBgDim = (d: BgDim) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-bg-dim', d);
    }
  };

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('uba_theme', theme);
  }, [theme]);

  useEffect(() => {
    applyTextScale(textScale);
    localStorage.setItem('uba_font_scale', textScale);
  }, [textScale]);

  useEffect(() => {
    applyBgDim(bgDim);
    localStorage.setItem('uba_bg_dim', bgDim);
  }, [bgDim]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const increaseTextSize = () => {
    setTextScaleState(prev => (prev === 'sm' ? 'base' : 'lg'));
  };

  const decreaseTextSize = () => {
    setTextScaleState(prev => (prev === 'lg' ? 'base' : 'sm'));
  };

  const resetTextSize = () => {
    setTextScaleState('base');
  };

  const setTextScale = (s: TextScale) => {
    setTextScaleState(s);
  };

  const toggleBgDim = () => {
    setBgDimState(prev => (prev === 'normal' ? 'soft' : prev === 'soft' ? 'deep' : 'normal'));
  };

  const setBgDim = (d: BgDim) => {
    setBgDimState(d);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        textScale,
        increaseTextSize,
        decreaseTextSize,
        resetTextSize,
        setTextScale,
        bgDim,
        toggleBgDim,
        setBgDim
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
