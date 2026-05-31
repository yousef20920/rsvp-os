import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      },
      colors: {
        porcelain: "#f7f2ed",
        ink: "#1f1a17",
        blush: "#d9a3a0",
        champagne: "#ead9bd",
        olive: "#747d5c",
        wine: "#6f3032"
      },
      boxShadow: {
        glass: "0 30px 90px rgba(65, 42, 36, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
