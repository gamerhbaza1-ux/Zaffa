'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useUser } from '@/firebase';

export type Theme = 'groom' | 'bride';

// The context now only provides the theme, no setter.
type ThemeContextType = {
    theme: Theme;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { userProfile } = useUser();
    
    // The theme is directly derived from the user's role. Default to 'groom'.
    const theme: Theme = userProfile?.role || 'groom';

    useEffect(() => {
        const root = document.documentElement;
        // Clean up previous themes and apply the current one.
        root.classList.remove('theme-groom', 'theme-bride');
        root.classList.add(`theme-${theme}`);
    }, [theme]);
    
    // The context value no longer includes a toggle function.
    const value = { theme };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
