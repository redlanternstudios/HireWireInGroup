// Legacy ESLint config for Next.js + TypeScript + React
module.exports = {
  root: true,
  extends: [
    'next',
    'next/core-web-vitals',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
};
