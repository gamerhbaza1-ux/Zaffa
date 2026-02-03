"use client";

import { useUser } from "@/firebase";
import { useEffect } from "react";

export function ThemeManager() {
  const { userProfile, isUserLoading, isProfileLoading } = useUser();

  useEffect(() => {
    // Wait until we have the profile information
    if (isUserLoading || isProfileLoading) {
      return;
    }

    const root = document.documentElement;
    
    // Clean up previous theme classes
    root.classList.remove("theme-groom", "theme-bride");

    if (userProfile?.role === "bride") {
      root.classList.add("theme-bride");
    } else {
      // Default to groom theme if no profile or role is 'groom'
      root.classList.add("theme-groom");
    }
  }, [userProfile, isUserLoading, isProfileLoading]);

  // This component does not render anything to the DOM
  return null;
}
