import React from 'react';
import styled from 'styled-components';
import { SessionRecoveryData } from '../../services/sessionService';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';

interface SessionRecoveryModalProps {
    recoveryData: SessionRecoveryData;
    onRecover: () => void;
    onDiscard: () => void;
    isLoading?: boolean;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled(Card)`
  max-width: 500px;
  width: 90%;
  margin: 20px;
`;

const ModalHeader = styled.div`
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  margin: 0 0 8px 0;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
`;

const ModalSubtitle = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const SessionInfo = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: ${props => props.theme.colors.text.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const WarningText = styled.p`
  color: ${props => props.theme.colors.warning};
  font-size: 0.9rem;
  margin: 16px 0;
  padding: 12px;
  background: ${props => props.theme.colors.warning}20;
  border-radius: 6px;
  border-left: 4px solid ${props => props.theme.colors.warning};
`;

export const SessionRecoveryModal: React.FC<SessionRecoveryModalProps> = ({
    recoveryData,
    onRecover,
    onDiscard,
    isLoading = false
}) => {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatDuration = (startTime: number, endTime: number) => {
        const durationMs = endTime - startTime;
        const minutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    const getProgressText = () => {
        const { completedQuestions, totalQuestions, currentQuestion } = recoveryData.data.progress;
        return `Question ${currentQuestion + 1} of ${totalQuestions} (${completedQuestions} completed)`;
    };

    return (
        <ModalOverlay>
            <ModalContent>
                <ModalHeader>
                    <ModalTitle>Session Recovery</ModalTitle>
                    <ModalSubtitle>
                        We found a previous session that wasn't completed. Would you like to continue where you left off?
                    </ModalSubtitle>
                </ModalHeader>

                <SessionInfo>
                    <InfoRow>
                        <InfoLabel>Study:</InfoLabel>
                        <InfoValue>{recoveryData.data.studyId}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>Progress:</InfoLabel>
                        <InfoValue>{getProgressText()}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>Last Saved:</InfoLabel>
                        <InfoValue>{formatDate(recoveryData.timestamp)}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>Session Duration:</InfoLabel>
                        <InfoValue>
                            {formatDuration(recoveryData.data.progress.startTime, recoveryData.timestamp)}
                        </InfoValue>
                    </InfoRow>
                </SessionInfo>

                <WarningText>
                    If you choose to start a new session, your previous progress will be lost permanently.
                </WarningText>

                <ButtonGroup>
                    <Button
                        variant="secondary"
                        onClick={onDiscard}
                        disabled={isLoading}
                    >
                        Start New Session
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onRecover}
                        disabled={isLoading}
                        isLoading={isLoading}
                    >
                        Continue Previous Session
                    </Button>
                </ButtonGroup>
            </ModalContent>
        </ModalOverlay>
    );
};