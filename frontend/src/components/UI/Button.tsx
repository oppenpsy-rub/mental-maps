import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'small';
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

const getVariantStyles = (variant: ButtonProps['variant']) => {
  switch (variant) {
    case 'primary':
      return css`
        background: ${theme.colors.primary[600]};
        color: white;
        border: 1px solid ${theme.colors.primary[600]};
        
        &:hover:not(:disabled) {
          background: ${theme.colors.primary[700]};
          border-color: ${theme.colors.primary[700]};
        }
        
        &:active:not(:disabled) {
          background: ${theme.colors.primary[800]};
        }
      `;
    case 'secondary':
      return css`
        background: white;
        color: ${theme.colors.gray[700]};
        border: 1px solid ${theme.colors.gray[300]};
        
        &:hover:not(:disabled) {
          background: ${theme.colors.gray[50]};
          border-color: ${theme.colors.gray[400]};
        }
      `;
    case 'success':
      return css`
        background: ${theme.colors.success[600]};
        color: white;
        border: 1px solid ${theme.colors.success[600]};
        
        &:hover:not(:disabled) {
          background: ${theme.colors.success[700]};
        }
      `;
    case 'error':
    case 'danger':
      return css`
        background: ${theme.colors.error[600]};
        color: white;
        border: 1px solid ${theme.colors.error[600]};
        
        &:hover:not(:disabled) {
          background: ${theme.colors.error[700]};
        }
      `;
    case 'warning':
      return css`
        background: ${theme.colors.warning[600]};
        color: white;
        border: 1px solid ${theme.colors.warning[600]};
        
        &:hover:not(:disabled) {
          background: ${theme.colors.warning[700]};
        }
      `;
    case 'ghost':
      return css`
        background: transparent;
        color: ${theme.colors.primary[600]};
        border: 1px solid transparent;
        
        &:hover:not(:disabled) {
          background: ${theme.colors.primary[50]};
          color: ${theme.colors.primary[700]};
        }
      `;
    case 'outline':
      return css`
        background: transparent;
        color: ${theme.colors.primary[600]};
        border: 1px solid ${theme.colors.primary[600]};
        
        &:hover:not(:disabled) {
          background: ${theme.colors.primary[50]};
          color: ${theme.colors.primary[700]};
          border-color: ${theme.colors.primary[700]};
        }
      `;
    default:
      return css`
        background: ${theme.colors.primary[600]};
        color: white;
        border: 1px solid ${theme.colors.primary[600]};
      `;
  }
};

const getSizeStyles = (size: ButtonProps['size']) => {
  switch (size) {
    case 'xs':
      return css`
        padding: 2px ${theme.spacing.xs};
        font-size: ${theme.typography.fontSize.xs};
        min-height: 24px;
      `;
    case 'sm':
    case 'small':
      return css`
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        font-size: ${theme.typography.fontSize.sm};
        min-height: 32px;
      `;
    case 'lg':
      return css`
        padding: ${theme.spacing.md} ${theme.spacing.xl};
        font-size: ${theme.typography.fontSize.lg};
        min-height: 48px;
      `;
    default:
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.md};
        font-size: ${theme.typography.fontSize.base};
        min-height: 40px;
      `;
  }
};

export const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['isLoading', 'fullWidth', 'variant', 'size', 'active', '$active', '$isActive', '$isLoading'].includes(prop),
})<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.xs};
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.typography.fontWeight.medium};
  font-family: ${theme.typography.fontFamily.sans.join(', ')};
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  
  ${props => getVariantStyles(props.variant)}
  ${props => getSizeStyles(props.size)}
  
  ${props => props.fullWidth && css`
    width: 100%;
  `}
  
  ${props => (props.disabled || props.isLoading) && css`
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  `}
  
  &:focus-visible {
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
  }

  ${mediaQueries.maxSm} {
    ${props => props.fullWidth && css`
      width: 100%;
    `}
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  
  ${mediaQueries.maxSm} {
    flex-direction: column;
    
    ${Button} {
      width: 100%;
    }
  }
`;

export default Button;