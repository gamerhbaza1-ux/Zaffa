'use client';

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// This is the most robust implementation. It uses a functional update with `setStoredValue`
// to ensure we always have the latest value and avoid stale closures, especially when the
// setter function is passed down through contexts or memoized callbacks.

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    
    // Function to read the value from localStorage. Memoized to prevent re-creation.
    const readValue = useCallback((): T => {
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
    
    // State to store our value. Initialized once with the value from localStorage.
    const [storedValue, setStoredValue] = useState<T>(readValue);

    // The setter function that will be returned. It persists the new value to localStorage.
    const setValue: Dispatch<SetStateAction<T>> = useCallback(
        (value) => {
            if (typeof window === 'undefined') {
                console.warn(`Tried to set localStorage key “${key}” even though no window was found`);
                return; // Early return if on server
            }

            try {
                // Use the functional update form of useState's setter to get the latest state.
                setStoredValue((currentValue) => {
                    // This allows the new value to be a function, just like with regular useState.
                    const newValue = value instanceof Function ? value(currentValue) : value;
                    // Save the new value to localStorage.
                    window.localStorage.setItem(key, JSON.stringify(newValue));
                    // Return the new value to update the state.
                    return newValue;
                });
                // Dispatch a custom event to notify other tabs of the change.
                window.dispatchEvent(new StorageEvent('storage', { key }));
            } catch (error) {
                console.warn(`Error setting localStorage key “${key}”:`, error);
            }
        },
        [key] // Dependency array only needs `key`. No dependency on `storedValue`.
    );

    // Effect to re-read from localStorage when the component mounts or key changes.
    useEffect(() => {
        setStoredValue(readValue());
    }, [readValue]);

    // Effect to listen for storage changes from other tabs.
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
