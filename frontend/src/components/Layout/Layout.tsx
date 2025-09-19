import React from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';
import Header from './Header';
import Sidebar from './Sidebar';
import NotificationContainer from '../Notifications/NotificationContainer';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${theme.colors.gray[50]};
`;

const MainContent = styled.main<{ $sidebarOpen: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: ${props => props.$sidebarOpen ? '250px' : '60px'};
  transition: margin-left 0.3s ease;

  ${mediaQueries.maxSm} {
    margin-left: 0;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: ${theme.spacing.lg};
  overflow-y: auto;

  ${mediaQueries.maxSm} {
    padding: ${theme.spacing.md};
  }
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <LayoutContainer>
      <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} />
      <MainContent $sidebarOpen={sidebarOpen}>
        <Header onToggleSidebar={handleToggleSidebar} />
        <ContentArea>
          {children}
        </ContentArea>
      </MainContent>
      <NotificationContainer />
    </LayoutContainer>
  );
};

export default Layout;