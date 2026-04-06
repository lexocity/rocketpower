const { themeColors } = require("./theme.config");
const plugin = require("tailwindcss/plugin");

const tailwindColors = Object.fromEntries(
  Object.entries(themeColors).map(([name, swatch]) => [
    name,
    {
      DEFAULT: `var(--color-${name})`,
      light: swatch.light,
      dark: swatch.dark,
    },
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}", "./lib/**/*.{js,ts,tsx}", "./hooks/**/*.{js,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: tailwindColors,
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: 0.2, transform: 'scale(0.8)' },
          '50%': { opacity: 1, transform: 'scale(1.2)' },
        },
        rocketShake: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(-1px, 1px) rotate(-1deg)' },
          '50%': { transform: 'translate(1px, -1px) rotate(1deg)' },
          '75%': { transform: 'translate(-1px, -1px) rotate(0deg)' },
        },
        nebulaGlow: {
          '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
          '50%': { opacity: 0.7, transform: 'scale(1.1)' },
        }
      },
      animation: {
        twinkle: 'twinkle 3s ease-in-out infinite',
        'rocket-shake': 'rocketShake 0.2s ease-in-out infinite',
        'nebula-glow': 'nebulaGlow 8s ease-in-out infinite',
      },
      fontFamily: {
        varsity: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
        script: ['"Pacifico"', 'cursive'],
        brannboll: ['"Brannboll"', 'cursive'],
      }
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ':root:not([data-theme="dark"]) &');
      addVariant("dark", ':root[data-theme="dark"] &');
    }),
  ],
};
