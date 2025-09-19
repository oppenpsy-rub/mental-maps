import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { mediaQueries, responsive } from '../../styles/mediaQueries';

interface TypographyProps {
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: keyof typeof theme.typography.fontWeight;
  responsive?: boolean;
}

export const Heading1 = styled.h1<TypographyProps>`
  margin: 0 0 ${theme.spacing.lg} 0;
  font-family: ${theme.typography.fontFamily.sans.join(', ')};
  font-weight: ${props => theme.typography.fontWeight[props.weight || 'bold']};
  line-height: ${theme.typography.lineHeight.tight};
  color: ${props => props.color || theme.colors.gray[900]};
  text-align: ${props => props.align || 'left'};
  
  ${props => props.responsive 
    ? responsive.fontSize(theme.typography.fontSize['2xl'], theme.typography.fontSize['3xl'], theme.typography.fontSize['4xl'])
    : `font-size: ${theme.typography.fontSize['3xl']};`
  }

  ${mediaQueries.maxSm} {
    margin-bottom: ${theme.spacing.md};
  }
`;

export const Heading2 = styled.h2<TypographyProps>`
  margin: 0 0 ${theme.spacing.md} 0;
  font-family: ${theme.typography.fontFamily.sans.join(', ')};
  font-weight: ${props => theme.typography.fontWeight[props.weight || 'semibold']};
  line-height: ${theme.typography.lineHeight.tight};
  color: ${props => props.color || theme.colors.gray[900]};
  text-align: ${props => props.align || 'left'};
  
  ${props => props.responsive 
    ? responsive.fontSize(theme.typography.fontSize.xl, theme.typography.fontSize['2xl'], theme.typography.fontSize['3xl'])
    : `font-size: ${theme.typography.fontSize['2xl']};`
  }
`;

export const Heading3 = styled.h3<TypographyProps>`
  margin: 0 0 ${theme.spacing.md} 0;
  font-family: ${theme.typography.fontFamily.sans.join(', ')};
  font-weight: ${props => theme.typography.fontWeight[props.weight || 'semibold']};
  line-height: ${theme.typography.lineHeight.tight};
  color: ${props => props.color || theme.colors.gray[900]};
  text-align: ${props => props.align || 'left'};
  
  ${props => props.responsive 
    ? responsive.fontSize(theme.typography.fontSize.lg, theme.typography.fontSize.xl, theme.typography.fontSize['2xl'])
    : `font-size: ${theme.typography.fontSize.xl};`
  }
`;

export const Heading4 = styled.h4<TypographyProps>`
  margin: 0 0 ${theme.spacing.sm} 0;
  font-family: ${theme.typography.fontFamily.sans.join(', ')};
  font-weight: ${props => theme.typography.fontWeight[props.weight || 'semibold']};
  line-height: ${theme.typography.lineHeight.normal};
  color: ${props => props.color || theme.colors.gray[900]};
  text-align: ${props => props.align || 'left'};
  font-size: ${theme.typography.fontSize.lg};
`;

export const Text = styled.p<TypographyProps>`
  margin: 0 0 ${theme.spacing.md} 0;
  font-family: ${theme.typography.fontFamily.sans.join(', ')};
  font-weight: ${props => theme.typography.fontWeight[props.weight || 'normal']};
  line-height: ${theme.typography.lineHeight.normal};
  color: ${props => props.color || theme.colors.gray[700]};
  text-align: ${props => props.align || 'left'};
  font-size: ${theme.typography.fontSize.base};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SmallText = styled.span<TypographyProps>`
  font-family: ${theme.typography.fontFamily.sans.join(', ')};
  font-weight: ${props => theme.typography.fontWeight[props.weight || 'normal']};
  line-height: ${theme.typography.lineHeight.normal};
  color: ${props => props.color || theme.colors.gray[600]};
  text-align: ${props => props.align || 'left'};
  font-size: ${theme.typography.fontSize.sm};
`;

export const Label = styled.label<TypographyProps>`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-family: ${theme.typography.fontFamily.sans.join(', ')};
  font-weight: ${props => theme.typography.fontWeight[props.weight || 'medium']};
  line-height: ${theme.typography.lineHeight.normal};
  color: ${props => props.color || theme.colors.gray[700]};
  text-align: ${props => props.align || 'left'};
  font-size: ${theme.typography.fontSize.sm};
`;

export const Code = styled.code`
  font-family: ${theme.typography.fontFamily.mono.join(', ')};
  font-size: ${theme.typography.fontSize.sm};
  background: ${theme.colors.gray[100]};
  color: ${theme.colors.gray[800]};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
`;

export default {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Text,
  SmallText,
  Label,
  Code,
};