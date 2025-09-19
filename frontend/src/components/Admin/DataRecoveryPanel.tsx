import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { directDatabaseService } from '../../services/directDatabaseService';

const Panel = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
`;

const Title = styled.h3`
  color: #dc3545;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.span<{ $type: 'error' | 'warning' | 'success' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => 
    props.$type === 'error' ? '#dc3545' :
    props.$type === 'warning' ? '#ffc107' : '#28a745'
  };
  color: white;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;
  background: ${props => 
    props.$variant === 'danger' ? '#dc3545' :
    props.$variant === 'secondary' ? '#6c757d' : '#007bff'
  };
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 200px;
  font-family: monospace;
  font-size: 12px;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  resize: vertical;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 16px;
  margin: 8px;
  text-align: center;
  min-width: 120px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
`;

const StatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 16px 0;
`;

const DataRecoveryPanel: React.FC = () => {
  const [storedResponses, setStoredResponses] = useState<any[]>([]);
  const [storedDemographics, setStoredDemographics] = useState<any[]>([]);
  const [sqlStatements, setSqlStatements] = useState<string>('');
  const [isDirectModeEnabled, setIsDirectModeEnabled] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadStoredData();
    setIsDirectModeEnabled(directDatabaseService.isDirectModeEnabled());
    
    // Auto-refresh every 3 seconds to show new data
    const interval = setInterval(() => {
      loadStoredData();
      setIsDirectModeEnabled(directDatabaseService.isDirectModeEnabled());
      setLastUpdate(new Date().toLocaleTimeString());
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStoredData = () => {
    // Load stored responses
    const responses = directDatabaseService.getStoredResponses();
    setStoredResponses(responses);

    // Load stored demographic data
    const demographicIndex = JSON.parse(localStorage.getItem('demographic_data_index') || '[]');
    const demographics = demographicIndex.map((key: string) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }).filter(Boolean);
    setStoredDemographics(demographics);

    // Generate SQL statements
    const sql = directDatabaseService.generateSQLStatements();
    setSqlStatements(sql.join('\n'));
  };

  const handleEnableDirectMode = () => {
    directDatabaseService.enableDirectMode();
    setIsDirectModeEnabled(true);
  };

  const handleDisableDirectMode = () => {
    directDatabaseService.disableDirectMode();
    setIsDirectModeEnabled(false);
  };

  const handleExportJSON = () => {
    const exportData = {
      responses: storedResponses,
      demographics: storedDemographics,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mental-maps-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSQL = () => {
    const blob = new Blob([sqlStatements], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mental-maps-data-import-${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all stored data? This cannot be undone!')) {
      directDatabaseService.clearStoredResponses();
      
      // Clear demographic data
      const demographicIndex = JSON.parse(localStorage.getItem('demographic_data_index') || '[]');
      demographicIndex.forEach((key: string) => localStorage.removeItem(key));
      localStorage.removeItem('demographic_data_index');
      
      loadStoredData();
    }
  };

  const handleSimulateResponse = async () => {
    console.log('🎭 Simulating response submission...');
    
    const result = await directDatabaseService.submitResponseDirect({
      participantId: `test_participant_${Date.now()}`,
      questionId: `test_question_${Math.random().toString(36).substring(2, 8)}`,
      responseData: { answer: 'Simulated test response', value: Math.random() },
      mapDrawing: { 
        elements: [
          { type: 'circle', coordinates: [46.5 + Math.random(), 6.5 + Math.random()], style: { color: 'red' } },
          { type: 'polygon', coordinates: [[46.5, 6.5], [46.6, 6.5], [46.6, 6.6], [46.5, 6.6]], style: { color: 'blue' } }
        ]
      },
      responseTimeMs: Math.floor(Math.random() * 10000) + 1000
    });
    
    console.log('✅ Simulated response result:', result);
    loadStoredData();
  };

  const handleSimulateDemographic = () => {
    console.log('🎭 Simulating demographic submission...');
    
    const participantId = `demo_participant_${Date.now()}`;
    const demographicRecord = {
      participantId,
      demographicData: {
        age: Math.floor(Math.random() * 50) + 18,
        gender: ['male', 'female', 'other'][Math.floor(Math.random() * 3)],
        education: ['high_school', 'bachelor', 'master', 'phd'][Math.floor(Math.random() * 4)]
      },
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    const storageKey = `demographic_${participantId}_${Date.now()}`;
    localStorage.setItem(storageKey, JSON.stringify(demographicRecord));
    
    const indexKey = 'demographic_data_index';
    const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
    existingIndex.push(storageKey);
    localStorage.setItem(indexKey, JSON.stringify(existingIndex));
    
    console.log('✅ Simulated demographic stored:', storageKey);
    loadStoredData();
  };

  const handleTestBackend = async () => {
    console.log('🧪 Testing backend response submission...');
    
    try {
      const response = await fetch('http://localhost:5002/api/participate/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_token'
        },
        body: JSON.stringify({
          questionId: 'test_question',
          responseType: 'map_drawing',
          responseData: { test: true },
          metadata: { responseTime: 1000 }
        })
      });

      console.log('📡 Backend response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Backend test failed:', response.status, errorData);
        alert(`Backend test failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      } else {
        console.log('✅ Backend test successful');
        alert('Backend is working correctly!');
      }
    } catch (error) {
      console.error('❌ Backend test error:', error);
      alert(`Backend test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const totalElements = storedResponses.reduce((sum, response) => {
    return sum + (response.mapDrawing?.elements?.length || 0);
  }, 0);

  return (
    <Panel>
      <Title>
        🚨 Data Recovery Panel
        <StatusBadge $type={isDirectModeEnabled ? 'warning' : 'error'}>
          {isDirectModeEnabled ? 'Direct Mode Active' : 'Backend Mode'}
        </StatusBadge>
        {lastUpdate && <small style={{ marginLeft: '8px', fontSize: '10px' }}>Last update: {lastUpdate}</small>}
      </Title>
      
      <p>
        This panel helps recover data when the backend is not working properly. 
        When direct mode is enabled, responses are stored locally and can be exported for manual database import.
      </p>

      <StatsContainer>
        <StatCard>
          <StatValue>{storedResponses.length}</StatValue>
          <StatLabel>Stored Responses</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{storedDemographics.length}</StatValue>
          <StatLabel>Demographic Records</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalElements}</StatValue>
          <StatLabel>Drawing Elements</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{storedResponses.filter(r => !r.synced).length}</StatValue>
          <StatLabel>Unsynced</StatLabel>
        </StatCard>
      </StatsContainer>

      <div style={{ marginBottom: '16px' }}>
        <h4>Mode Control:</h4>
        {isDirectModeEnabled ? (
          <Button $variant="secondary" onClick={handleDisableDirectMode}>
            Disable Direct Mode
          </Button>
        ) : (
          <Button $variant="primary" onClick={handleEnableDirectMode}>
            Enable Direct Mode
          </Button>
        )}
        <Button $variant="primary" onClick={loadStoredData}>
          Refresh Data
        </Button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4>Test Functions:</h4>
        <Button $variant="primary" onClick={handleSimulateResponse}>
          Simulate Response
        </Button>
        <Button $variant="primary" onClick={handleSimulateDemographic}>
          Simulate Demographic
        </Button>
        <Button $variant="secondary" onClick={handleTestBackend}>
          Test Backend
        </Button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4>Data Export:</h4>
        <Button $variant="primary" onClick={handleExportJSON} disabled={storedResponses.length === 0 && storedDemographics.length === 0}>
          Export as JSON
        </Button>
        <Button $variant="primary" onClick={handleExportSQL} disabled={storedResponses.length === 0}>
          Export as SQL
        </Button>
        <Button $variant="danger" onClick={handleClearData} disabled={storedResponses.length === 0 && storedDemographics.length === 0}>
          Clear All Data
        </Button>
      </div>

      {storedResponses.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4>Stored Responses Preview:</h4>
          <div style={{ maxHeight: '200px', overflow: 'auto', background: 'white', padding: '12px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
            {storedResponses.map((response, index) => (
              <div key={index} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                <strong>Response {index + 1}:</strong> {response.timestamp}<br />
                <small>Participant: {response.participantId.substring(0, 8)}... | Question: {response.questionId.substring(0, 8)}...</small>
                {response.mapDrawing?.elements && (
                  <small> | Elements: {response.mapDrawing.elements.length}</small>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sqlStatements && (
        <div style={{ marginTop: '16px' }}>
          <h4>Generated SQL Statements:</h4>
          <p style={{ fontSize: '12px', color: '#6c757d' }}>
            Copy these SQL statements and run them directly in your PostgreSQL database to import the stored responses.
          </p>
          <TextArea value={sqlStatements} readOnly />
        </div>
      )}
    </Panel>
  );
};

export default DataRecoveryPanel;