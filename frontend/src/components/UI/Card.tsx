import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';

interface CardProps {
  padding?: keyof typeof theme.spacing;
  shadow?: keyof typeof theme.shadows;
  borderRadius?: keyof typeof theme.borderRadius;
  hover?: boolean;
  interactive?: boolean;
}

export const Card = styled.div<CardProps>`
  background: white;
  border-radius: ${props => theme.borderRadius[props.borderRadius || 'lg']};
  box-shadow: ${props => theme.shadows[props.shadow || 'base']};
  padding: ${props => theme.spacing[props.padding || 'lg']};
  transition: all 0.2s ease;

  ${props => props.hover && `
    &:hover {
      box-shadow: ${theme.shadows.md};
      transform: translateY(-2px);
    }
  `}

  ${props => props.interactive && `
    cursor: pointer;
    
    &:hover {
      box-shadow: ${theme.shadows.lg};
    }
    
    &:active {
      transform: translateY(1px);
    }
  `}

  ${mediaQueries.maxSm} {
    padding: ${props => theme.spacing[props.padding || 'md']};
    border-radius: ${props => theme.borderRadius[props.borderRadius || 'md']};
  }
`;

export const CardHeader = styled.div`
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.gray[200]};
`;

export const CardTitle = styled.h3`
  margin: 0 0 ${theme.spacing.sm} 0;
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.gray[900]};
  line-height: ${theme.typography.lineHeight.tight};

  ${mediaQueries.maxSm} {
    font-size: ${theme.typography.fontSize.lg};
  }
`;

export const CardDescription = styled.p`
  margin: 0;
  color: ${theme.colors.gray[600]};
  font-size: ${theme.typography.fontSize.sm};
  line-height: ${theme.typography.lineHeight.normal};
`;

export const CardContent = styled.div`
  /* Content styles can be added here */
`;

export const CardFooter = styled.div`
  margin-top: ${theme.spacing.lg};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.gray[200]};
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};

  ${mediaQueries.maxSm} {
    flex-direction: column;
    gap: ${theme.spacing.xs};
  }
`;

export default Card;