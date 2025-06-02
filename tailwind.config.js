const {
  colorTokens,
  typographyTokens,
  spacingTokens,
  borderRadiusTokens,
  shadowTokens,
  breakpointTokens,
  componentTokens,
} = require('./src/design-system/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/design-system/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: colorTokens,
      fontFamily: typographyTokens.fontFamily,
      fontSize: typographyTokens.fontSize,
      fontWeight: typographyTokens.fontWeight,
      spacing: spacingTokens,
      borderRadius: borderRadiusTokens,
      boxShadow: shadowTokens,
      screens: breakpointTokens,
      zIndex: componentTokens.zIndex,
      // Add component-specific utilities
      height: {
        'form-input': componentTokens.form.inputHeight,
        'form-button': componentTokens.form.buttonHeight,
      },
      gap: {
        'form-label': componentTokens.form.labelGap,
        'form-element': componentTokens.form.elementSpacing,
      },
      padding: {
        content: componentTokens.form.contentPadding,
      },
    },
  },
  plugins: [],
};
