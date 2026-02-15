import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0c0c14",
        foreground: "#e0e0e8",
        surface: "#14141f",
        "surface-2": "#1c1c2b",
        border: "#2a2a3d",
        accent: "#3b82f6",
        "accent-dim": "#1e3a5f",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        muted: "#6b7280",
      },
    },
  },
  plugins: [],
};
export default config;
