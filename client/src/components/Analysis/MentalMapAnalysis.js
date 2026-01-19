import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import MentalMapViewer from './MentalMapViewer';
import MentalMapHeatmap from './MentalMapHeatmap';

const MentalMapAnalysis = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [questionLabels, setQuestionLabels] = useState({});
  const [activeTab, setActiveTab] = useState('viewer'); // 'viewer' or 'heatmap'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [geoResponse, studyResponse] = await Promise.all([
          axios.get(`/api/export/${studyId}/geojson`),
          axios.get(`/api/studies/${studyId}`)
        ]);

        setData(geoResponse.data);

        // Extract question labels from study config
        if (studyResponse.data && studyResponse.data.config && Array.isArray(studyResponse.data.config.questions)) {
            const labels = {};
            studyResponse.data.config.questions.forEach(q => {
                labels[q.id] = q.text || q.id;
            });
            setQuestionLabels(labels);
        }
      } catch (error) {
        console.error("Error fetching study data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (studyId) {
      fetchData();
    }
  }, [studyId]);

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Loading analysis data...</div>;
  if (!data || !data.features) return <div style={{padding: '40px', textAlign: 'center'}}>No data found or error loading data.</div>;

  const featureCount = data.features.length;

  return (
    <div className="analysis-container" style={{padding: '20px', maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px'}}>Mental Map Analysis</h2>
            <p style={{color: '#6b7280', fontSize: '14px'}}>Study ID: {studyId} • {featureCount} Mental Maps loaded</p>
        </div>
        <button 
          onClick={() => navigate('/admin')}
          style={{
            padding: '8px 16px', 
            backgroundColor: '#4b5563', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Back to Dashboard
        </button>
      </div>

      <div className="tabs" style={{display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb'}}>
        <button 
          onClick={() => setActiveTab('viewer')}
          style={{
            padding: '12px 4px', 
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'viewer' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'viewer' ? '#2563eb' : '#6b7280',
            cursor: 'pointer',
            fontWeight: activeTab === 'viewer' ? 600 : 500,
            fontSize: '16px'
          }}
        >
          Map Viewer
        </button>
        <button 
          onClick={() => setActiveTab('heatmap')}
          style={{
            padding: '12px 4px', 
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'heatmap' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'heatmap' ? '#2563eb' : '#6b7280',
            cursor: 'pointer',
            fontWeight: activeTab === 'heatmap' ? 600 : 500,
            fontSize: '16px'
          }}
        >
          Heatmap Analysis
        </button>
      </div>

      <div style={{minHeight: '600px'}}>
        {activeTab === 'viewer' && (
          <MentalMapViewer mentalMaps={data.features} questionLabels={questionLabels} />
        )}

        {activeTab === 'heatmap' && (
          <MentalMapHeatmap mentalMapData={data} questionLabels={questionLabels} />
        )}
      </div>
    </div>
  );
};

export default MentalMapAnalysis;
