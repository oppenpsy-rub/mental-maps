import React from 'react';
import styled from 'styled-components';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';

const HeaderContainer = styled.header`
  background: white;
  border-bottom: 1px solid ${theme.colors.gray[200]};
  padding: 0 ${theme.spacing.lg};
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows.sm};
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  padding: ${theme.spacing.xs};
  cursor: pointer;
  border-radius: ${theme.borderRadius.base};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.gray[600]};
  
  &:hover {
    background-color: ${theme.colors.gray[100]};
    color: ${theme.colors.gray[800]};
  }

  ${mediaQueries.maxSm} {
    display: block;
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.gray[900]};

  ${mediaQueries.maxSm} {
    font-size: ${theme.typography.fontSize.lg};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  ${mediaQueries.maxSm} {
    gap: ${theme.spacing.xs};
  }
`;

const UserName = styled.span`
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.gray[700]};
  font-size: ${theme.typography.fontSize.sm};

  ${mediaQueries.maxSm} {
    display: none;
  }
`;

const LogoutButton = styled.button`
  background: ${theme.colors.error[600]};
  color: white;
  border: none;
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.base};
  cursor: pointer;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${theme.colors.error[700]};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.error[500]};
    outline-offset: 2px;
  }

  ${mediaQueries.maxSm} {
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
  }
`;

interface HeaderProps {
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
    };

    // Path-based page title detection (works reliably)
    const getPageTitle = () => {
        const path = window.location.pathname;
        if (path.includes('dashboard')) return 'Dashboard';
        if (path.includes('edit')) return 'Studie bearbeiten';
        if (path.includes('analysis')) return 'Analyse';
        if (path.includes('map-demo')) return 'Karten-Demo';
        return 'Mental Maps';
    };

    // Alternative: If you want to use Redux later, you can try this approach:
    // const currentPage = useAppSelector((state) => {
    //     try {
    //         return (state as any).ui?.currentPage || 'dashboard';
    //     } catch {
    //         return 'dashboard';
    //     }
    // });



    return (
        <HeaderContainer>
            <LeftSection>
                <MenuButton onClick={onToggleSidebar}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </MenuButton>
                <PageTitle>{getPageTitle()}</PageTitle>
            </LeftSection>

            <RightSection>
                <UserInfo>
                    <UserName>{user?.name}</UserName>
                    <LogoutButton onClick={handleLogout}>
                        Abmelden
                    </LogoutButton>
                </UserInfo>
            </RightSection>
        </HeaderContainer>
    );
};

export default Header;