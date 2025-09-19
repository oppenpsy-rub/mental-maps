import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

interface AutoSaveIndicatorProps {
  connectionStatus: 'online' | 'offline';
  lastSaveTime?: number;
  className?: string;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Indicator = styled.div<{ status: 'saving' | 'saved' | 'offline' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  animation: ${fadeIn} 0.3s ease;
  
  ${props => {
    switch (props.status) {
      case 'saving':
        return `
          background: ${props.theme.colors.primary}20;
          color: ${props.theme.colors.primary};
          animation: ${pulse} 1.5s infinite;
        `;
      case 'saved':
        return `
          background: ${props.theme.colors.success}20;
          color: ${props.theme.colors.success};
        `;
      case 'offline':
        return `
          background: ${props.theme.colors.warning}20;
          color: ${props.theme.colors.warning};
        `;
      case 'error':
        return `
          background: ${props.theme.colors.error}20;
          color: ${props.theme.colors.error};
        `;
      default:
        return '';
    }
  }}
`;

const StatusIcon = styled.div<{ $status: 'saving' | 'saved' | 'offline' | 'error' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  
  ${props => {
    switch (props.$status) {
      case 'saving':
        return `
          background: ${props.theme.colors.primary};
          animation: ${pulse} 1.5s infinite;
        `;
      case 'saved':
        return `
          background: ${props.theme.colors.success};
        `;
      case 'offline':
        return `
          background: ${props.theme.colors.warning};
        `;
      case 'error':
        return `
          background: ${props.theme.colors.error};
        `;
      default:
        return '';
    }
  }}
`;

const StatusText = styled.span`
  white-space: nowrap;
`;

const TimeText = styled.span`
  opacity: 0.7;
  margin-left: 4px;
`;

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  connectionStatus,
  lastSaveTime,
  className
}) => {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'offline' | 'error'>('saved');
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update time ago display
  useEffect(() => {
    if (!lastSaveTime) return;

    const updateTimeAgo = () => {
      const now = Date.now();
      const diff = now - lastSaveTime;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) {
        setTimeAgo('just now');
      } else if (minutes < 60) {
        setTimeAgo(`${minutes}m ago`);
      } else {
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastSaveTime]);

  // Update save status based on connection
  useEffect(() => {
    if (connectionStatus === 'offline') {
      setSaveStatus('offline');
    } else {
      setSaveStatus('saved');
    }
  }, [connectionStatus]);

  // Simulate saving state (this would be triggered by actual save operations)
  useEffect(() => {
    let savingTimeout: NodeJS.Timeout;
    
    const handleSaving = () => {
      setSaveStatus('saving');
      savingTimeout = setTimeout(() => {
        setSaveStatus(connectionStatus === 'online' ? 'saved' : 'offline');
      }, 1000);
    };

    // Listen for storage events to detect saves
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mental_maps_session') {
        handleSaving();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (savingTimeout) clearTimeout(savingTimeout);
    };
  }, [connectionStatus]);

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return connectionStatus === 'online' ? 'All changes saved' : 'Saved locally';
      case 'offline':
        return 'Offline - saving locally';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  };

  return (
    <Indicator status={saveStatus} className={className}>
      <StatusIcon $status={saveStatus} />
      <StatusText>
        {getStatusText()}
        {lastSaveTime && timeAgo && (
          <TimeText>• {timeAgo}</TimeText>
        )}
      </StatusText>
    </Indicator>
  );
};