import React from 'react';
import styled from 'styled-components';
import ParticipantEntryForm from '../../components/Forms/ParticipantEntryForm';

const EntryContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
`;

const EntryCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 600px;
`;

const ParticipantEntry: React.FC = () => {
  return (
    <EntryContainer>
      <EntryCard>
        <ParticipantEntryForm />
      </EntryCard>
    </EntryContainer>
  );
};

export default ParticipantEntry;