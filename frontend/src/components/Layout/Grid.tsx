import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';

interface GridProps {
  columns?: number;
  smColumns?: number;
  mdColumns?: number;
  lgColumns?: number;
  gap?: keyof typeof theme.spacing;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
}

export const Grid = styled.div<GridProps>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 1}, 1fr);
  gap: ${props => theme.spacing[props.gap || 'md']};
  align-items: ${props => props.alignItems || 'stretch'};
  justify-items: ${props => props.justifyItems || 'stretch'};

  ${props => props.smColumns && mediaQueries.sm} {
    grid-template-columns: repeat(${props => props.smColumns}, 1fr);
  }

  ${props => props.mdColumns && mediaQueries.md} {
    grid-template-columns: repeat(${props => props.mdColumns}, 1fr);
  }

  ${props => props.lgColumns && mediaQueries.lg} {
    grid-template-columns: repeat(${props => props.lgColumns}, 1fr);
  }
`;

interface FlexProps {
  direction?: 'row' | 'column';
  wrap?: boolean;
  gap?: keyof typeof theme.spacing;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  responsive?: boolean;
}

export const Flex = styled.div<FlexProps>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  flex-wrap: ${props => props.wrap ? 'wrap' : 'nowrap'};
  gap: ${props => theme.spacing[props.gap || 'md']};
  align-items: ${props => props.alignItems || 'stretch'};
  justify-content: ${props => props.justifyContent || 'flex-start'};

  ${props => props.responsive && mediaQueries.maxSm} {
    flex-direction: column;
  }
`;

interface GridItemProps {
  colSpan?: number;
  smColSpan?: number;
  mdColSpan?: number;
  lgColSpan?: number;
}

export const GridItem = styled.div<GridItemProps>`
  grid-column: span ${props => props.colSpan || 1};

  ${props => props.smColSpan && mediaQueries.sm} {
    grid-column: span ${props => props.smColSpan};
  }

  ${props => props.mdColSpan && mediaQueries.md} {
    grid-column: span ${props => props.mdColSpan};
  }

  ${props => props.lgColSpan && mediaQueries.lg} {
    grid-column: span ${props => props.lgColSpan};
  }
`;

export default Grid;