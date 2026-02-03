'use client';

import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";

// These are hardcoded to match the primary colors of the themes.
// Using CSS variables for the *other* theme is tricky.
const GROOM_THEME_COLOR = 'hsl(142 76% 36%)'; // Green
const BRIDE_THEME_COLOR = 'hsl(340 82% 56%)'; // Pink

export function ThemeSwitcher() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="تغيير السمة"
            className="h-8 w-8 rounded-full"
        >
            <div
                className="h-5 w-5 rounded-full transition-colors"
                style={{ 
                    backgroundColor: theme === 'groom' ? BRIDE_THEME_COLOR : GROOM_THEME_COLOR
                }}
            />
        </Button>
    );
}
