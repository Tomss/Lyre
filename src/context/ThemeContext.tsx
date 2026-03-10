import { API_URL } from '../config';
import { useAuth } from './AuthContext';
import React, { createContext, useContext, useState, useEffect } from 'react';


interface ThemeSettings {
    site_logo_url: string;
    theme_primary_color: string;
    theme_secondary_color: string;
    carousel_interval: string; // Stored as string in DB
    [key: string]: string; // Allow dynamic access
}



interface ThemeContextType {
    settings: ThemeSettings;
    updateSettings: (newSettings: Partial<ThemeSettings>) => Promise<void>;
    loading: boolean;
    pageHeaders: Record<string, string>;
    updatePageHeader: (slug: string, imageUrl: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default settings
const defaultSettings: ThemeSettings = {
    site_logo_url: '',
    theme_primary_color: '#0D9488', // Default Teal
    theme_secondary_color: '#0891B2', // Default Cyan
    carousel_interval: '5000',
};

// Helper: Convert Hex to RGB
const hexToRgb = (hex: string) => {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return { r, g, b };
};

// Helper: Mix color with white (tint) or black (shade)
// factor: 0-1. 1 = full mix color, 0 = base color
const mix = (color1: { r: number, g: number, b: number }, color2: { r: number, g: number, b: number }, factor: number) => {
    return {
        r: Math.round(color1.r + (color2.r - color1.r) * factor),
        g: Math.round(color1.g + (color2.g - color1.g) * factor),
        b: Math.round(color1.b + (color2.b - color1.b) * factor),
    };
};

const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const generatePalette = (baseHex: string, rootName: string) => {
    const base = hexToRgb(baseHex);
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };

    const palette: Record<string, string> = {
        // Tints (Light)
        '25': rgbToHex(mix(base, white, 0.95).r, mix(base, white, 0.95).g, mix(base, white, 0.95).b),
        '50': rgbToHex(mix(base, white, 0.9).r, mix(base, white, 0.9).g, mix(base, white, 0.9).b),
        '100': rgbToHex(mix(base, white, 0.8).r, mix(base, white, 0.8).g, mix(base, white, 0.8).b),
        '200': rgbToHex(mix(base, white, 0.6).r, mix(base, white, 0.6).g, mix(base, white, 0.6).b),
        '300': rgbToHex(mix(base, white, 0.4).r, mix(base, white, 0.4).g, mix(base, white, 0.4).b),
        '400': rgbToHex(mix(base, white, 0.2).r, mix(base, white, 0.2).g, mix(base, white, 0.2).b),
        // Base
        '500': baseHex, // Using base as 500 for now, or 600? Tailwind standard 'teal-600' was the base. 
        // Let's assume user picks the vibrant middle color.
        '600': rgbToHex(mix(base, black, 0.1).r, mix(base, black, 0.1).g, mix(base, black, 0.1).b),
        // Shades (Dark)
        '700': rgbToHex(mix(base, black, 0.3).r, mix(base, black, 0.3).g, mix(base, black, 0.3).b),
        '800': rgbToHex(mix(base, black, 0.5).r, mix(base, black, 0.5).g, mix(base, black, 0.5).b),
        '900': rgbToHex(mix(base, black, 0.7).r, mix(base, black, 0.7).g, mix(base, black, 0.7).b),
    };

    // Set CSS variables
    const root = document.documentElement;

    // Custom mapping for our specific Tailwind config usage
    // We mapped 'primary' to 'var(--color-primary)' which should be the user's picked color
    root.style.setProperty(`--color-${rootName}`, baseHex);

    // Also 'accent' was Teal-400. Let's map it to the 400 value.
    if (rootName === 'primary') {
        root.style.setProperty('--color-accent', palette['400']);
    }

    // Set the numbered ramps
    Object.entries(palette).forEach(([key, value]) => {
        root.style.setProperty(`--color-${rootName}-${key}`, value);
    });

    const p25 = rgbToHex(mix(base, white, 0.97).r, mix(base, white, 0.97).g, mix(base, white, 0.97).b);
    const p50 = rgbToHex(mix(base, white, 0.93).r, mix(base, white, 0.93).g, mix(base, white, 0.93).b);
    const p100 = rgbToHex(mix(base, white, 0.85).r, mix(base, white, 0.85).g, mix(base, white, 0.85).b);
    const p200 = rgbToHex(mix(base, white, 0.7).r, mix(base, white, 0.7).g, mix(base, white, 0.7).b);
    const p300 = rgbToHex(mix(base, white, 0.5).r, mix(base, white, 0.5).g, mix(base, white, 0.5).b);
    const p400 = rgbToHex(mix(base, white, 0.25).r, mix(base, white, 0.25).g, mix(base, white, 0.25).b);

    const p600 = baseHex;

    const p500 = rgbToHex(mix(base, white, 0.1).r, mix(base, white, 0.1).g, mix(base, white, 0.1).b); // Slightly lighter than base

    const p700 = rgbToHex(mix(base, black, 0.15).r, mix(base, black, 0.15).g, mix(base, black, 0.15).b);
    const p800 = rgbToHex(mix(base, black, 0.3).r, mix(base, black, 0.3).g, mix(base, black, 0.3).b);
    const p900 = rgbToHex(mix(base, black, 0.5).r, mix(base, black, 0.5).g, mix(base, black, 0.5).b);

    root.style.setProperty(`--color-${rootName}-25`, p25);
    root.style.setProperty(`--color-${rootName}-50`, p50);
    root.style.setProperty(`--color-${rootName}-100`, p100);
    root.style.setProperty(`--color-${rootName}-200`, p200);
    root.style.setProperty(`--color-${rootName}-300`, p300);
    root.style.setProperty(`--color-${rootName}-400`, p400);
    root.style.setProperty(`--color-${rootName}-500`, p500);
    root.style.setProperty(`--color-${rootName}-600`, p600);
    root.style.setProperty(`--color-${rootName}-700`, p700);
    root.style.setProperty(`--color-${rootName}-800`, p800);
    root.style.setProperty(`--color-${rootName}-900`, p900);

    if (rootName === 'primary') {
        root.style.setProperty('--color-primary', p600);
        root.style.setProperty('--color-accent', p400);
    }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { logout } = useAuth();
    const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
    const [pageHeaders, setPageHeaders] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/settings`);
            if (!response.ok) throw new Error('Failed to fetch settings');
            const data = await response.json();

            // Merge with defaults
            const newSettings = { ...defaultSettings, ...data };
            setSettings(newSettings);

            // Apply to DOM
            if (newSettings.theme_primary_color) {
                generatePalette(newSettings.theme_primary_color, 'primary');
            }
            if (newSettings.theme_secondary_color) {
                generatePalette(newSettings.theme_secondary_color, 'secondary');
            }

        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const fetchPageHeaders = async () => {
        try {
            const response = await fetch(`${API_URL}/settings/headers`);
            if (response.ok) {
                const data = await response.json();
                setPageHeaders(data);
            }
        } catch (error) {
            console.error('Error loading page headers:', error);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchSettings(), fetchPageHeaders()]);
            setLoading(false);
        };
        loadAll();
    }, []);

    const updateSettings = async (newSettings: Partial<ThemeSettings>) => {
        try {
            // optimistic update
            const updated = { ...settings, ...newSettings };
            setSettings(updated as ThemeSettings);

            if (updated.theme_primary_color) {
                generatePalette(updated.theme_primary_color, 'primary');
            }
            if (updated.theme_secondary_color) {
                generatePalette(updated.theme_secondary_color, 'secondary');
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newSettings)
            });

            if (response.status === 401 || response.status === 403) {
                logout();
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }

            if (!response.ok) throw new Error('Failed to update settings');

        } catch (error) {
            console.error('Failed to save settings:', error);
            fetchSettings(); // Revert on error
        }
    };

    const updatePageHeader = async (slug: string, imageUrl: string) => {
        try {
            // Optimistic update
            setPageHeaders(prev => ({
                ...prev,
                [slug]: imageUrl
            }));

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/settings/headers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ slug, imageUrl })
            });

            if (!response.ok) throw new Error('Failed to update header');
        } catch (error) {
            console.error('Error updating page header:', error);
            fetchPageHeaders(); // Revert
        }
    };

    return (
        <ThemeContext.Provider value={{ settings, updateSettings, loading, pageHeaders, updatePageHeader }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
