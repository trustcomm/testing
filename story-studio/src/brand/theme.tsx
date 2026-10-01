import React, { createContext, useContext } from "react";
import { themes, type ThemeMode } from "./tokens";

const ThemeContext = createContext<ThemeMode>("paper");

export const ThemeProvider: React.FC<{ mode: ThemeMode; children?: React.ReactNode }> = ({ mode, children }) => (
  <ThemeContext.Provider value={mode}>{children}</ThemeContext.Provider>
);

/** Current theme colours: `bg` (background) and `fg` (text + lines). */
export const useTheme = () => themes[useContext(ThemeContext)];
