// tailwind.config.ts
const config = {
  theme: {
    extend: {
      fontFamily: {
        sedgwick: ["var(--font-sedgwick)", "cursive"], // agora Tailwind reconhece
        zenDots: ['"Zen Dots"', 'sans-serif'],
      },
    },
  },
};

export default config;
