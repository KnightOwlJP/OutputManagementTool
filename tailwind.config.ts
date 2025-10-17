import type { Config } from "tailwindcss";
const { heroui } = require("@heroui/react");

console.log('[Tailwind Config] Loading HeroUI plugin:', !!heroui);

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/react/dist/**/*.{js,mjs}",
    "./node_modules/@heroui/system/dist/**/*.{js,mjs}",
    "./node_modules/@heroui/theme/dist/**/*.{js,mjs}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          primary: {
            DEFAULT: "#0070F3",
            foreground: "#FFFFFF",
          },
          focus: "#0070F3",
        },
      },
      dark: {
        colors: {
          primary: {
            DEFAULT: "#1E90FF",
            foreground: "#FFFFFF",
          },
          focus: "#1E90FF",
        },
      },
    },
  })],
};

console.log('[Tailwind Config] Content paths:', config.content);
console.log('[Tailwind Config] Plugins count:', config.plugins?.length);

export default config;
