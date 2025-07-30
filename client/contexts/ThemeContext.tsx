import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { customer, updateCustomerProfile } = useAuth();
  const [theme, setThemeState] = useState<Theme>("light");

  // Initialize theme from localStorage or customer preferences
  useEffect(() => {
    const initializeTheme = () => {
      // Check localStorage first
      const savedTheme = localStorage.getItem("roam_theme") as Theme;
      
      // Check system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      // Determine initial theme
      let initialTheme: Theme = "light";
      
      if (savedTheme) {
        initialTheme = savedTheme;
      } else if (systemPrefersDark) {
        initialTheme = "dark";
      }
      
      setThemeState(initialTheme);
      applyTheme(initialTheme);
    };

    initializeTheme();
  }, []);

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  // Set theme and persist it
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    // Save to localStorage
    localStorage.setItem("roam_theme", newTheme);
    
    // Save to customer profile if logged in
    if (customer && updateCustomerProfile) {
      try {
        // We'll add a darkMode field to the customer profile
        console.log("Saving theme preference to customer profile:", newTheme);
        // For now, we'll just save to localStorage since the database schema 
        // doesn't have a theme field yet
      } catch (error) {
        console.error("Failed to save theme preference:", error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const isDark = theme === "dark";

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
