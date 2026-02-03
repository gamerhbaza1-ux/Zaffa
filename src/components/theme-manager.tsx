"use client";

import { useTheme } from "@/hooks/use-theme";

// This component applies the theme on load and ensures it's reactive.
// It does not render anything to the DOM.
export function ThemeManager() {
  useTheme();
  return null;
}
