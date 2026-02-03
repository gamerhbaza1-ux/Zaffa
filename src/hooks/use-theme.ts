'use client';

import { useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

export type Theme = 'groom' | 'bride';

export function useTheme() {
    const [theme, setTheme] = useLocalStorage<Theme>('theme', 'groom');

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('theme-groom', 'theme-bride');
        if (theme === 'bride') {
            root.classList.add('theme-bride');
        } else {
            root.classList.add('theme-groom');
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'groom' ? 'bride' : 'groom'));
    }, [setTheme]);

    return { theme, toggleTheme };
}
