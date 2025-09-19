import { useState, useEffect } from 'react';
import { theme } from '../styles/theme';

interface BreakpointState {
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const getBreakpointValue = (breakpoint: string): number => {
  return parseInt(breakpoint.replace('px', ''), 10);
};

export const useResponsive = (): BreakpointState => {
  const [breakpoints, setBreakpoints] = useState<BreakpointState>({
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      
      const xs = getBreakpointValue(theme.breakpoints.xs);
      const sm = getBreakpointValue(theme.breakpoints.sm);
      const md = getBreakpointValue(theme.breakpoints.md);
      const lg = getBreakpointValue(theme.breakpoints.lg);
      const xl = getBreakpointValue(theme.breakpoints.xl);

      setBreakpoints({
        isXs: width >= xs,
        isSm: width >= sm,
        isMd: width >= md,
        isLg: width >= lg,
        isXl: width >= xl,
        isMobile: width < sm,
        isTablet: width >= sm && width < lg,
        isDesktop: width >= lg,
      });
    };

    // Initial check
    updateBreakpoints();

    // Add event listener
    window.addEventListener('resize', updateBreakpoints);

    // Cleanup
    return () => window.removeEventListener('resize', updateBreakpoints);
  }, []);

  return breakpoints;
};

export default useResponsive;