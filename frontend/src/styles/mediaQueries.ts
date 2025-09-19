import { theme } from './theme';

// Media query helpers for responsive design
export const mediaQueries = {
  // Mobile first approach
  xs: `@media (min-width: ${theme.breakpoints.xs})`,
  sm: `@media (min-width: ${theme.breakpoints.sm})`,
  md: `@media (min-width: ${theme.breakpoints.md})`,
  lg: `@media (min-width: ${theme.breakpoints.lg})`,
  xl: `@media (min-width: ${theme.breakpoints.xl})`,

  // Max-width queries for desktop-first approach
  maxXs: `@media (max-width: ${theme.breakpoints.xs})`,
  maxSm: `@media (max-width: ${theme.breakpoints.sm})`,
  maxMd: `@media (max-width: ${theme.breakpoints.md})`,
  maxLg: `@media (max-width: ${theme.breakpoints.lg})`,
  maxXl: `@media (max-width: ${theme.breakpoints.xl})`,

  // Between breakpoints
  smToMd: `@media (min-width: ${theme.breakpoints.sm}) and (max-width: ${theme.breakpoints.md})`,
  mdToLg: `@media (min-width: ${theme.breakpoints.md}) and (max-width: ${theme.breakpoints.lg})`,

  // Orientation queries
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',

  // High DPI displays
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',

  // Reduced motion preference
  reducedMotion: '@media (prefers-reduced-motion: reduce)',

  // Dark mode preference
  darkMode: '@media (prefers-color-scheme: dark)',
};

// Utility function to create responsive values
export const responsive = {
  // Create responsive font sizes
  fontSize: (mobile: string, tablet?: string, desktop?: string) => `
    font-size: ${mobile};
    ${tablet ? `${mediaQueries.sm} { font-size: ${tablet}; }` : ''}
    ${desktop ? `${mediaQueries.lg} { font-size: ${desktop}; }` : ''}
  `,

  // Create responsive spacing
  spacing: (mobile: string, tablet?: string, desktop?: string) => `
    ${mobile};
    ${tablet ? `${mediaQueries.sm} { ${tablet}; }` : ''}
    ${desktop ? `${mediaQueries.lg} { ${desktop}; }` : ''}
  `,

  // Create responsive grid
  grid: (mobile: number, tablet?: number, desktop?: number) => `
    grid-template-columns: repeat(${mobile}, 1fr);
    ${tablet ? `${mediaQueries.sm} { grid-template-columns: repeat(${tablet}, 1fr); }` : ''}
    ${desktop ? `${mediaQueries.lg} { grid-template-columns: repeat(${desktop}, 1fr); }` : ''}
  `,
};