module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        // loader: 'loaderAnim 2s infinite',
        loader: 'loader 2s infinite',
      },
      keyframes: {
        loader: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%, 80%': { transform: 'rotateY(-180deg)' },
          '90%, 100%': { opacity: '0', transform: 'rotateY(-180deg)' },
        },
      },
    },
  },
  plugins: [],
};
