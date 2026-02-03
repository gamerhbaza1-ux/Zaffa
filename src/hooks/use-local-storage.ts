'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// A helper function to safely get a value from localStorage
function getValueFromLocalStorage<T>(key: string, initialValue: T): T {
    // Prevent SSR errors
    if (typeof window === 'undefined') {
        return initialValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        return initialValue;
    }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    
    // Initialize with initialValue to ensure server and client match on first render.
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // This effect runs only on the client, after the component has mounted.
    // It updates the state with the value from localStorage, triggering a re-render.
    useEffect(() => {
        setStoredValue(getValueFromLocalStorage(key, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);


    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue: Dispatch<SetStateAction<T>> = (value) => {
        // Prevent SSR errors
        if (typeof window === 'undefined') {
            console.warn(`Tried to set localStorage key “${key}” even though no window was found`);
            return;
        }

        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(valueToStore);
            // Save to local storage
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    };
    
    // This effect listens for changes in other tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch(e) {
                     console.warn(`Error parsing storage change for key “${key}”:`, e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key]);

    return [storedValue, setValue];
}
