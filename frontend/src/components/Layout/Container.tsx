import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';

interface ContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  center?: boolean;
}

const getMaxWidth = (maxWidth: ContainerProps['maxWidth']) => {
  switch (maxWidth) {
    case 'sm': return '640px';
    case 'md': return '768px';
    case 'lg': return '1024px';
    case 'xl': return '1280px';
    case 'full': return '100%';
    default: return '1200px';
  }
};

export const Container = styled.div<ContainerProps>`
  width: 100%;
  max-width: ${props => getMaxWidth(props.maxWidth)};
  margin: ${props => props.center !== false ? '0 auto' : '0'};
  padding: ${props => props.padding !== false ? `0 ${theme.spacing.md}` : '0'};

  ${mediaQueries.sm} {
    padding: ${props => props.padding !== false ? `0 ${theme.spacing.lg}` : '0'};
  }

  ${mediaQueries.lg} {
    padding: ${props => props.padding !== false ? `0 ${theme.spacing.xl}` : '0'};
  }
`;

export default Container;