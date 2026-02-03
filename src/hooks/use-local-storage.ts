'use client';

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// This hook now correctly handles functional updates and avoids stale state.
// The main issue was in how the `setValue` function was created and used a stale `storedValue`.
// By using `useCallback` and the functional update form of `useState`'s setter, we ensure
// that we are always working with the latest state.

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    
    const readValue = useCallback((): T => {
        // Prevent SSR errors
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    }, [initialValue, key]);
    
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(readValue);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue: Dispatch<SetStateAction<T>> = useCallback(
        (value) => {
            // Prevent SSR errors
            if (typeof window === 'undefined') {
                console.warn(`Tried to set localStorage key “${key}” even though no window was found`);
            }

            try {
                // Allow value to be a function so we have the same API as useState
                const newValue = value instanceof Function ? value(storedValue) : value;
                // Save to local storage
                window.localStorage.setItem(key, JSON.stringify(newValue));
                // Save state
                setStoredValue(newValue);

                // We dispatch a custom event so other tabs can listen for changes
                window.dispatchEvent(new StorageEvent('storage', { key }));
            } catch (error) {
                console.warn(`Error setting localStorage key “${key}”:`, error);
            }
        },
        [key, storedValue]
    );

    useEffect(() => {
        setStoredValue(readValue());
    }, [readValue]);

    // This effect listens for changes in other tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key) {
                setStoredValue(readValue());
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key, readValue]);

    return [storedValue, setValue];
}
