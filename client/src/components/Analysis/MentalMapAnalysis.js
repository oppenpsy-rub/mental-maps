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

  if (loading) return <div className="analysis-loading">Loading analysis data...</div>;
  if (!data || !data.features) return <div className="analysis-error">No data found or error loading data.</div>;

  const featureCount = data.features.length;

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <div>
            <h2 className="analysis-title">VOICE Mental Maps Analysis</h2>
            <p className="analysis-meta">Study ID: {studyId} • {featureCount} VOICE Mental Maps loaded</p>
        </div>
        <button 
          onClick={() => navigate('/admin')}
          className="analysis-btn-back"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="analysis-tabs">
        <button 
          onClick={() => setActiveTab('viewer')}
          className={`analysis-tab-btn ${activeTab === 'viewer' ? 'active' : ''}`}
        >
          Map Viewer
        </button>
        <button 
          onClick={() => setActiveTab('heatmap')}
          className={`analysis-tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
        >
          Heatmap Analysis
        </button>
      </div>

      <div className="analysis-content">
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
