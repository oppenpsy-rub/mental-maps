import React from 'react';
import styled from 'styled-components';
import { SessionData } from '../../services/sessionService';

interface ProgressIndicatorProps {
    session: SessionData;
    showDetails?: boolean;
    className?: string;
}

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.background.secondary};
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background: linear-gradient(90deg, 
    ${props => props.theme.colors.primary.main} 0%, 
    ${props => props.theme.colors.primary.light} 100%
  );
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const ProgressLabel = styled.span`
  font-weight: 500;
`;

const ProgressPercentage = styled.span`
  color: ${props => props.theme.colors.primary};
  font-weight: 600;
`;

const DetailedInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 8px;
  padding: 12px;
  background: ${props => props.theme.colors.background.secondary};
  border-radius: 6px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InfoLabel = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
`;

const ConnectionStatus = styled.div<{ status: 'online' | 'offline' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: ${props => props.status === 'online'
        ? props.theme.colors.success
        : props.theme.colors.warning
    };
`;

const StatusDot = styled.div<{ $status: 'online' | 'offline' }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.$status === 'online'
        ? props.theme.colors.success
        : props.theme.colors.warning
    };
`;

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    session,
    showDetails = false,
    className
}) => {
    const { progress } = session;
    const percentage = progress.totalQuestions > 0
        ? (progress.completedQuestions / progress.totalQuestions) * 100
        : 0;

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const formatDuration = (startTime: number) => {
        const durationMs = Date.now() - startTime;
        const minutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    const getConnectionStatus = (): 'online' | 'offline' => {
        return navigator.onLine ? 'online' : 'offline';
    };

    return (
        <ProgressContainer className={className}>
            <ProgressBar>
                <ProgressFill $percentage={percentage} />
            </ProgressBar>

            <ProgressText>
                <ProgressLabel>
                    Question {progress.currentQuestion + 1} of {progress.totalQuestions}
                </ProgressLabel>
                <ProgressPercentage>
                    {Math.round(percentage)}%
                </ProgressPercentage>
            </ProgressText>

            {showDetails && (
                <DetailedInfo>
                    <InfoItem>
                        <InfoLabel>Completed</InfoLabel>
                        <InfoValue>{progress.completedQuestions}</InfoValue>
                    </InfoItem>

                    <InfoItem>
                        <InfoLabel>Remaining</InfoLabel>
                        <InfoValue>{progress.totalQuestions - progress.completedQuestions}</InfoValue>
                    </InfoItem>

                    <InfoItem>
                        <InfoLabel>Started</InfoLabel>
                        <InfoValue>{formatTime(progress.startTime)}</InfoValue>
                    </InfoItem>

                    <InfoItem>
                        <InfoLabel>Duration</InfoLabel>
                        <InfoValue>{formatDuration(progress.startTime)}</InfoValue>
                    </InfoItem>

                    <InfoItem>
                        <InfoLabel>Last Saved</InfoLabel>
                        <InfoValue>{formatTime(progress.lastSaveTime)}</InfoValue>
                    </InfoItem>

                    <InfoItem>
                        <InfoLabel>Status</InfoLabel>
                        <ConnectionStatus status={getConnectionStatus()}>
                            <StatusDot $status={getConnectionStatus()} />
                            {getConnectionStatus()}
                        </ConnectionStatus>
                    </InfoItem>
                </DetailedInfo>
            )}
        </ProgressContainer>
    );
};