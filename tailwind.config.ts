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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          1: "#ffd344",
          2: "#f89b1e",
          3: "#fff6d8",
        },
        red: {
          1: "#ff3333",
        },
      },
    },
  },
  plugins: [],
};
export default config;
