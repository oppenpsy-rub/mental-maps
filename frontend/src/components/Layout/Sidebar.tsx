import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '../../store/slices/uiSlice';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';
import { useResponsive } from '../../hooks/useResponsive';

const SidebarContainer = styled.aside<{ $isOpen: boolean; $isMobile: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: ${props => props.$isOpen ? '250px' : '60px'};
  background: ${theme.colors.gray[800]};
  transition: width 0.3s ease;
  z-index: ${theme.zIndex.fixed};
  overflow: hidden;
  box-shadow: ${theme.shadows.lg};

  ${mediaQueries.maxSm} {
    width: ${props => props.$isOpen ? '250px' : '0'};
    ${props => props.$isOpen && `
      box-shadow: ${theme.shadows.xl};
    `}
  }
`;

const SidebarHeader = styled.div<{ $isOpen: boolean }>`
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.gray[700]};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  min-height: 64px;
`;

const Logo = styled.div`
  width: 32px;
  height: 32px;
  background: ${theme.colors.primary[600]};
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${theme.typography.fontWeight.bold};
  font-size: ${theme.typography.fontSize.sm};
  flex-shrink: 0;
`;

const LogoText = styled.span<{ $isOpen: boolean }>`
  color: white;
  font-weight: ${theme.typography.fontWeight.semibold};
  font-size: ${theme.typography.fontSize.lg};
  opacity: ${props => props.$isOpen ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const Navigation = styled.nav`
  padding: ${theme.spacing.md} 0;
`;

const NavItem = styled(NavLink)<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  color: ${theme.colors.gray[300]};
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  
  &:hover {
    background: ${theme.colors.gray[700]};
    color: white;
  }
  
  &.active {
    background: ${theme.colors.primary[600]};
    color: white;
  }
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  span {
    opacity: ${props => props.$isOpen ? 1 : 0};
    transition: opacity 0.3s ease;
    white-space: nowrap;
  }
`;

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();

  const handleNavClick = (page: string) => {
    dispatch(setCurrentPage(page));
  };

  return (
    <SidebarContainer $isOpen={isOpen} $isMobile={isMobile}>
      <SidebarHeader $isOpen={isOpen}>
        <Logo>MM</Logo>
        <LogoText $isOpen={isOpen}>Mental Maps</LogoText>
      </SidebarHeader>
      
      <Navigation>
        <NavItem 
          to="/dashboard" 
          $isOpen={isOpen}
          onClick={() => handleNavClick('dashboard')}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
          <span>Dashboard</span>
        </NavItem>
        
        <NavItem 
          to="/studies" 
          $isOpen={isOpen}
          onClick={() => handleNavClick('studies')}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Studien</span>
        </NavItem>
        
        <NavItem 
          to="/analysis" 
          $isOpen={isOpen}
          onClick={() => handleNavClick('analysis')}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Analyse</span>
        </NavItem>
        
        <NavItem 
          to="/flom-demo" 
          $isOpen={isOpen}
          onClick={() => handleNavClick('flom-demo')}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>🎯 FLOM Demo</span>
        </NavItem>
      </Navigation>
    </SidebarContainer>
  );
};

export default Sidebar;