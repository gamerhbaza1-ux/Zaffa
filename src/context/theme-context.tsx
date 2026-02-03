'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useUser } from '@/firebase';

export type Theme = 'groom' | 'bride';

type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { userProfile } = useUser();
    // Initialize with a default and let the effects handle the update.
    const [theme, setTheme] = useLocalStorage<Theme>('theme', 'groom');
    
    // Update theme based on user's role, but only if they haven't manually changed it.
    useEffect(() => {
        if (userProfile?.role) {
            const manualOverride = localStorage.getItem('theme_manual_override');
            if (!manualOverride) {
                setTheme(userProfile.role);
            }
        }
    }, [userProfile?.role, setTheme]);


    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('theme-groom', 'theme-bride');
        root.classList.add(`theme-${theme}`);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        localStorage.setItem('theme_manual_override', 'true');
        setTheme(prevTheme => (prevTheme === 'groom' ? 'bride' : 'groom'));
    }, [setTheme]);
    
    const value = { theme, toggleTheme };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
