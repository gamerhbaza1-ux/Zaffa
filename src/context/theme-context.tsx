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
    const { userProfile, isProfileLoading } = useUser();
    
    // The theme is directly derived from the user's role.
    const derivedTheme: Theme | null = userProfile?.role || null;

    useEffect(() => {
        // Only apply the theme class once the user profile has been loaded.
        // This prevents a race condition where the default theme is applied and not updated.
        if (!isProfileLoading && derivedTheme) {
            const root = document.documentElement;
            
            if (derivedTheme === 'bride') {
                root.classList.remove('theme-groom');
                root.classList.add('theme-bride');
            } else { // 'groom' or any other fallback
                root.classList.remove('theme-bride');
                root.classList.add('theme-groom');
            }
        }
    }, [derivedTheme, isProfileLoading]);
    
    // The context value provides a non-null theme, defaulting to 'groom' during load.
    const value = { theme: derivedTheme || 'groom' };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
