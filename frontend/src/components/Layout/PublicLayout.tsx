import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';
import NotificationContainer from '../Notifications/NotificationContainer';

const PublicLayoutContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${theme.colors.primary[500]} 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
`;

const PublicHeader = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  ${mediaQueries.maxSm} {
    padding: ${theme.spacing.md};
  }
`;

const Logo = styled.h1`
  color: white;
  margin: 0;
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};

  ${mediaQueries.maxSm} {
    font-size: ${theme.typography.fontSize.lg};
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};

  ${mediaQueries.maxSm} {
    padding: ${theme.spacing.md};
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <PublicLayoutContainer>
      <PublicHeader>
        <Logo>Mental Maps</Logo>
      </PublicHeader>
      <MainContent>
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </MainContent>
      <NotificationContainer />
    </PublicLayoutContainer>
  );
};

export default PublicLayout;