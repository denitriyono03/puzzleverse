// Branding and identifiers are configurable here only.
// Change these values to rebrand; no game code hard-codes the name.
export const CONFIG = {
  appName: import.meta.env.VITE_APP_NAME || 'PuzzleVerse',
  version: '0.1.0',
  bundleId: 'com.puzzleverse.app',
  androidPackage: 'com.puzzleverse.app',
  iosBundleId: 'com.puzzleverse.app',
  windowsAppId: 'com.puzzleverse.app',
  premium: { monthlyPrice: '$4.99', yearlyPrice: '$39.99', monthlyLabel: 'Monthly', yearlyLabel: 'Yearly' },
  colors: { accentDefault: '#7c5cff', terracotta: '#c2572b', amber: '#e8a33d' },
};
export const ACCENTS: Record<string, string> = {
  Violet: '#7c5cff', Terracotta: '#c2572b', Teal: '#0f766e', Rose: '#be185d', Amber: '#b45309', Blue: '#1d4ed8',
};
