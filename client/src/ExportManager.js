import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function ExportManager({ studyId, studyName, onBack }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showQGISGuide, setShowQGISGuide] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const response = await axios.get(`/api/export/${studyId}/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Zusammenfassung:', error);
      setMessage(t('error_loading_study_summary'));
    }
  }, [studyId]);

  const loadParticipants = useCallback(async () => {
    try {
      const response = await axios.get(`/api/export/${studyId}/participants`);
      setParticipants(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Teilnehmer:', error);
      setMessage(t('error_loading_participants'));
    }
  }, [studyId]);

  useEffect(() => {
    if (studyId) {
      loadSummary();
      loadParticipants();
    }
  }, [studyId, loadSummary, loadParticipants]);

  const downloadGeoJSON = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/export/${studyId}/geojson`, {
        responseType: 'blob'
      });
      
      // Erstelle einen Download-Link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study_${studyId}_export.geojson`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage(t('geojson_export_successful'));
    } catch (error) {
      console.error('Fehler beim GeoJSON-Export:', error);
      setMessage(t('error_geojson_export'));
    }
    setLoading(false);
  };

  const downloadCSV = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/export/${studyId}/csv`, {
        responseType: 'blob'
      });
      
      // Erstelle einen Download-Link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study_${studyId}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage(t('csv_export_successful'));
    } catch (error) {
      console.error('Fehler beim CSV-Export:', error);
      setMessage(t('error_csv_export'));
    }
    setLoading(false);
  };

  const downloadParticipantGeoJSON = async (participantCode) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/export/${studyId}/participant/${participantCode}/geojson`, {
        responseType: 'blob'
      });
      
      // Erstelle einen Download-Link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study_${studyId}_participant_${participantCode}_export.geojson`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage(t('participant_geojson_export_successful', { participant: participantCode }));
    } catch (error) {
      console.error('Fehler beim Teilnehmer-GeoJSON-Export:', error);
      setMessage(t('error_participant_geojson_export'));
    }
    setLoading(false);
  };

  const copyParticipantCodes = () => {
    const codes = participants.map(p => p.code).join('\n');
    navigator.clipboard.writeText(codes).then(() => {
      setMessage(t('participant_codes_copied'));
      setTimeout(() => setMessage(''), 3000);
    }).catch(() => {
      setMessage(t('error_copying_codes'));
    });
  };

  const deleteParticipant = async (participantId, participantCode) => {
    if (!window.confirm(t('confirm_delete_participant', { participant: participantCode }))) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`/api/export/${studyId}/participants/${participantId}`);
      
      if (response.data.success) {
        setMessage(t('participant_deleted_successfully', { participant: participantCode }));
        // Teilnehmer-Liste und Zusammenfassung neu laden
        await loadParticipants();
        await loadSummary();
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Teilnehmers:', error);
      if (error.response?.status === 404) {
        setMessage(t('participant_not_found'));
      } else {
        setMessage(t('error_deleting_participant'));
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ 
        color: '#2c3e50', 
        fontSize: '28px', 
        fontWeight: '600', 
        marginBottom: '20px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '10px'
      }}>
{t('data_export_title')}: {studyName}
      </h1>
      
      {/* Nachricht */}
      {message && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: message.includes('Fehler') ? '#f8d7da' : '#d1ecf1',
          color: message.includes('Fehler') ? '#721c24' : '#0c5460',
          border: '1px solid',
          borderColor: message.includes('Fehler') ? '#f5c6cb' : '#bee5eb',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {summary && (
        <div>
          {/* Studien-Zusammenfassung */}
          <div style={{ 
            border: '1px solid #dee2e6', 
            padding: '24px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              color: '#495057', 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '20px',
              marginTop: '0'
            }}>
              {t('study_summary_title')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>{t('participants_count')}</h4>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#495057' }}>
                  {summary.statistics.participants}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>{t('responses_count')}</h4>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#495057' }}>
                  {summary.statistics.responses}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>{t('questions_count')}</h4>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#495057' }}>
                  {summary.study.questions}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>{t('answered_questions_count')}</h4>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#495057' }}>
                  {summary.statistics.questions_answered}
                </div>
              </div>
            </div>
          </div>

          {/* Export-Optionen */}
          <div style={{ 
            border: '1px solid #dee2e6', 
            padding: '24px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ 
                color: '#495057', 
                fontSize: '20px', 
                fontWeight: '600', 
                marginTop: '0',
                marginBottom: '0',
                marginRight: '12px'
              }}>
                {t('export_options_title')}
              </h2>
              <button
                onClick={() => setShowQGISGuide(true)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title={t('qgis_guide_tooltip')}
              >
                ?
              </button>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={downloadGeoJSON}
                disabled={loading || summary.statistics.responses === 0}
                style={{
                  padding: '12px 20px',
                  backgroundColor: loading || summary.statistics.responses === 0 ? '#e9ecef' : '#495057',
                  color: loading || summary.statistics.responses === 0 ? '#6c757d' : 'white',
                  border: '1px solid',
                  borderColor: loading || summary.statistics.responses === 0 ? '#dee2e6' : '#495057',
                  borderRadius: '6px',
                  cursor: loading || summary.statistics.responses === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
{t('geojson_for_qgis')}
              </button>
              
              <button
                onClick={downloadCSV}
                disabled={loading || summary.statistics.responses === 0}
                style={{
                  padding: '12px 20px',
                  backgroundColor: loading || summary.statistics.responses === 0 ? '#e9ecef' : '#6c757d',
                  color: loading || summary.statistics.responses === 0 ? '#6c757d' : 'white',
                  border: '1px solid',
                  borderColor: loading || summary.statistics.responses === 0 ? '#dee2e6' : '#6c757d',
                  borderRadius: '6px',
                  cursor: loading || summary.statistics.responses === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
{t('csv_for_excel_spss')}
              </button>
            </div>
            
            {summary.statistics.responses === 0 && (
              <p style={{ color: '#dc3545', marginTop: '16px', fontStyle: 'italic', fontSize: '14px' }}>
                {t('no_responses_available_export')}
              </p>
            )}
          </div>

          {/* Teilnehmer-Übersicht */}
          <div style={{ 
            border: '1px solid #dee2e6', 
            padding: '24px', 
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ 
                color: '#495057', 
                fontSize: '20px', 
                fontWeight: '600', 
                margin: '0'
              }}>
                {t('participants_overview')} ({participants.length})
              </h2>
              <button
                onClick={copyParticipantCodes}
                disabled={participants.length === 0}
                style={{
                  padding: '8px 16px',
                  backgroundColor: participants.length === 0 ? '#e9ecef' : '#6c757d',
                  color: participants.length === 0 ? '#6c757d' : 'white',
                  border: '1px solid',
                  borderColor: participants.length === 0 ? '#dee2e6' : '#6c757d',
                  borderRadius: '6px',
                  cursor: participants.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {t('copy_codes')}
              </button>
            </div>

            {participants.length === 0 ? (
              <p style={{ color: '#6c757d', fontStyle: 'italic', margin: '0' }}>{t('no_participants')}</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600', color: '#495057' }}>Code</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600', color: '#495057' }}>{t('limesurvey_id')}</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600', color: '#495057' }}>{t('responses')}</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600', color: '#495057' }}>{t('created')}</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600', color: '#495057' }}>{t('export')}</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600', color: '#495057' }}>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant, index) => (
                      <tr key={participant.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                        <td style={{ padding: '12px', border: 'none', borderBottom: '1px solid #dee2e6', fontFamily: 'monospace', fontSize: '14px' }}>
                          {participant.code}
                        </td>
                        <td style={{ padding: '12px', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px' }}>
                          {participant.limesurvey_id || '-'}
                        </td>
                        <td style={{ padding: '12px', border: 'none', borderBottom: '1px solid #dee2e6', textAlign: 'center', fontSize: '14px' }}>
                          {participant.response_count}
                        </td>
                        <td style={{ padding: '12px', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px' }}>
                          {new Date(participant.created_at).toLocaleDateString('de-DE')}
                        </td>
                        <td style={{ padding: '12px', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px' }}>
                          <button
                            onClick={() => downloadParticipantGeoJSON(participant.code)}
                            disabled={loading || participant.response_count === 0}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: loading || participant.response_count === 0 ? '#e9ecef' : '#28a745',
                              color: loading || participant.response_count === 0 ? '#6c757d' : 'white',
                              border: '1px solid',
                              borderColor: loading || participant.response_count === 0 ? '#dee2e6' : '#28a745',
                              borderRadius: '4px',
                              cursor: loading || participant.response_count === 0 ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            title={participant.response_count === 0 ? t('no_responses_available') : t('download_geojson_for_participant')}
                          >
                            GeoJSON
                          </button>
                        </td>
                        <td style={{ padding: '12px', border: 'none', borderBottom: '1px solid #dee2e6', fontSize: '14px' }}>
                          <button
                            onClick={() => deleteParticipant(participant.id, participant.code)}
                            disabled={loading}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: loading ? '#e9ecef' : '#dc3545',
                              color: loading ? '#6c757d' : 'white',
                              border: '1px solid',
                              borderColor: loading ? '#dee2e6' : '#dc3545',
                              borderRadius: '4px',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            title={t('delete_participant')}
                          >
                            {t('delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* {t('questions_overview')} */}
          <div style={{ 
            border: '1px solid #dee2e6', 
            padding: '24px', 
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              color: '#495057', 
              fontSize: '20px', 
              fontWeight: '600', 
              marginTop: '0',
              marginBottom: '20px'
            }}>
              {t('questions_overview')}
            </h2>
            {summary.questions.map((question, index) => (
              <div key={index} style={{
                border: '1px solid #dee2e6',
                padding: '16px',
                marginBottom: '12px',
                borderRadius: '6px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '16px', fontWeight: '600' }}>
                      {t('question_number')} {index + 1}: {question.id}
                    </h4>
                    <p style={{ margin: '0 0 12px 0', color: '#6c757d', fontSize: '14px' }}>{question.text}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6c757d' }}>
                      <span><strong>{t('question_type')}:</strong> {question.type}</span>
                      {question.audioFile && <span><strong>{t('audio_file')}:</strong> {question.audioFile}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QGIS Visualisierungsanleitung Modal */}
      {showQGISGuide && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1000'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            margin: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ 
                color: '#2c3e50', 
                fontSize: '24px', 
                fontWeight: '600', 
                margin: '0'
              }}>
                {t('qgis_guide_title')}
              </h2>
              <button
                onClick={() => setShowQGISGuide(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ lineHeight: '1.6', color: '#495057' }}>
              <p style={{ marginBottom: '20px', fontSize: '16px', color: '#6c757d' }}>
                {t('qgis_guide_intro')}
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#495057', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  {t('qgis_step1_title')}
                </h3>
                <p style={{ marginBottom: '8px' }}>
                  {t('qgis_step1_text')}{' '}
                  <a 
                    href="https://qgis.org/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#007bff', textDecoration: 'none' }}
                  >
                    https://qgis.org/download/
                  </a>{' '}
                  {t('qgis_step1_download')}.
                </p>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#495057', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  {t('qgis_step2_title')}
                </h3>
                <p style={{ marginBottom: '8px' }}>
                  {t('qgis_step2_text')}
                </p>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#495057', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  {t('qgis_step3_title')}
                </h3>
                <p style={{ marginBottom: '8px' }}>
                  {t('qgis_step3_text')}
                </p>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#495057', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  {t('qgis_step4_title')}
                </h3>
                <p style={{ marginBottom: '8px' }}>
                  {t('qgis_step4_text')}
                </p>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#495057', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  {t('qgis_step5_title')}
                </h3>
                <p style={{ marginBottom: '8px' }}>
                  {t('qgis_step5_text')}
                </p>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={() => setShowQGISGuide(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {t('understood')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: '1px solid #6c757d',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          ← {t('back_to_studies')}
        </button>
      </div>
    </div>
  );
}

export default ExportManager;
