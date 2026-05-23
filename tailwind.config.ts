import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#f4f7fb",
        signal: "#2563eb",
        safe: "#16803c",
        caution: "#b7791f",
        risk: "#b91c1c"
      }
    }
  },
  plugins: []
};

export default config;
