import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';
import { mediaQueries } from './mediaQueries';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    line-height: ${theme.typography.lineHeight.normal};

    ${mediaQueries.maxLg} {
      font-size: 15px;
    }

    ${mediaQueries.maxSm} {
      font-size: 14px;
    }
  }

  body {
    font-family: ${theme.typography.fontFamily.sans.join(', ')};
    font-weight: ${theme.typography.fontWeight.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${theme.colors.gray[50]};
    color: ${theme.colors.gray[900]};
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
    
    &:focus-visible {
      outline: 2px solid ${theme.colors.primary[500]};
      outline-offset: 2px;
    }
  }

  input, textarea, select {
    font-family: inherit;
    outline: none;
    
    &:focus {
      outline: 2px solid ${theme.colors.primary[500]};
      outline-offset: 2px;
    }
  }

  a {
    color: ${theme.colors.primary[600]};
    text-decoration: none;
    
    &:hover {
      color: ${theme.colors.primary[700]};
      text-decoration: underline;
    }
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.gray[100]};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.gray[400]};
    border-radius: ${theme.borderRadius.sm};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.gray[500]};
  }

  /* Reduced motion support */
  ${mediaQueries.reducedMotion} {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default GlobalStyles;