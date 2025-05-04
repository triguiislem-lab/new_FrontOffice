/**
 * Custom theme configuration for Material Tailwind
 * This file defines the brand colors and other theme settings
 */

const theme = {
  colors: {
    primary: {
      50: "#F9F7F5",
      100: "#F0EAE5",
      200: "#E1D5CB",
      300: "#D2C0B1",
      400: "#C3AB97",
      500: "#A67B5B", // Main primary color
      600: "#8A5A3B",
      700: "#6E4A2F",
      800: "#523923",
      900: "#362717",
    },
    secondary: {
      50: "#F9F9F7",
      100: "#F0F0E5",
      200: "#E1E1CB",
      300: "#D2D2B1",
      400: "#C3C397",
      500: "#B4B47D",
      600: "#959563",
      700: "#76764F",
      800: "#57573B",
      900: "#383827",
    },
    accent: {
      50: "#FBF8E9",
      100: "#F7F1D3",
      200: "#EFE3A7",
      300: "#E7D57B",
      400: "#DFC74F",
      500: "#D4AF37", // Accent color
      600: "#AA8C2C",
      700: "#7F6921",
      800: "#554616",
      900: "#2A230B",
    },
  },
  fontFamily: {
    sans: ["Roboto", "sans-serif"],
    serif: ["Playfair Display", "serif"],
  },
  boxShadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    none: "none",
  },
  borderRadius: {
    none: "0",
    sm: "0.125rem",
    DEFAULT: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
};

export default theme;
